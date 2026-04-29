from fastapi import HTTPException

from app.db.supabase_client import supabase
from app.models.telemetria_model import TelemetriaInput
from app.services.umbrales_service import check_umbrales


def get_sensor_by_deveui(deveui: str):
    """El frontend envía `deveui`, pero en el schema actual se guarda como `device_id`."""
    response = (
        supabase.table("sensores")
        .select("*")
        .eq("device_id", deveui)
        .execute()
    )

    return response.data[0] if response.data else None


def get_default_predio_id():
    response = supabase.table("predio").select("id").limit(1).execute()
    if response.data:
        return response.data[0]["id"]
    return None


def create_sensor(deveui: str):
    """
    Auto-creación mínima para testing desde telemetría.
    Usa el primer predio disponible si existe.
    """
    payload = {
        "device_id": deveui,
        "sector": "default",
    }

    predio_id = get_default_predio_id()
    if predio_id:
        payload["predio_id"] = predio_id

    response = supabase.table("sensores").insert(payload).execute()

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="No se pudo crear automáticamente el sensor para la telemetría",
        )

    return response.data[0]


def insert_telemetry(data):
    sensor = get_sensor_by_deveui(data.deveui)

    if not sensor:
        sensor = create_sensor(data.deveui)

    sensor_id = sensor["id"]

    # Compute humidity values: prefer explicit humedad_aire/humedad_suelo if provided,
    # otherwise fall back to legacy `humedad` value.
    hum_aire = getattr(data, 'humedad_aire', None) if hasattr(data, 'humedad_aire') else None
    hum_suelo = getattr(data, 'humedad_suelo', None) if hasattr(data, 'humedad_suelo') else None
    humedad_for_telemetria = data.humedad if getattr(data, 'humedad', None) is not None else (hum_aire if hum_aire is not None else None)

    response = supabase.table("telemetria").insert(
        {
            "sensor_id": sensor_id,
            "humedad": humedad_for_telemetria,
            "temperatura": data.temperatura,
            "ph": data.ph,
            "voltaje": data.voltaje,
        }
    ).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Error al insertar telemetría")

    try:
        threshold_payload = TelemetriaInput(
            sensor_id=sensor_id,
            humedad=data.humedad,
            temperatura=data.temperatura,
            ph=data.ph,
            voltaje=data.voltaje,
        )
        check_umbrales(sensor, threshold_payload)
    except Exception:
        # Si los umbrales fallan no rompemos la inserción principal de telemetría.
        pass

    # Also insert a simplified agricultural reading into `lecturas_cultivo` so the frontend
    # (which reads that table) sees the latest samples. This is best-effort: failures
    # here won't break the main telemetry insertion.
    try:
        lecturas_payload = {}
        if data.temperatura is not None:
            lecturas_payload['temperatura'] = data.temperatura
        # prefer explicit humedad_aire / humedad_suelo when present
        if hum_aire is not None:
            lecturas_payload['humedad_aire'] = hum_aire
        elif data.humedad is not None:
            lecturas_payload['humedad_aire'] = data.humedad
        if hum_suelo is not None:
            lecturas_payload['humedad_suelo'] = hum_suelo

        if lecturas_payload:
            # Insert into lecturas_cultivo (Supabase will set created_at if configured)
            supabase.table('lecturas_cultivo').insert(lecturas_payload).execute()
    except Exception:
        # Don't fail the whole request if this extra insert doesn't work.
        pass

    return {
        "message": "Telemetría insertada correctamente",
        "sensor_id": sensor_id,
        "data": response.data,
    }