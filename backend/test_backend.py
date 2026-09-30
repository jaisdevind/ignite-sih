import io
import numpy as np
import cv2
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_pipeline():
    # 1. Create synthetic image
    img = np.zeros((64, 64, 3), dtype=np.uint8)
    img[20:40, 20:40] = [0, 255, 255] # yellow hotspot square
    _, buf = cv2.imencode('.png', img)

    # 2. Test /api/upload
    upload_resp = client.post('/api/upload', files={'file': ('test_thermal.png', io.BytesIO(buf.tobytes()), 'image/png')}).json()
    assert upload_resp['status'] == 'uploaded', f"Upload failed: {upload_resp}"
    image_id = upload_resp['id']
    print("[OK] Upload Test PASSED - Image ID:", image_id)

    # 3. Test /api/preprocess
    pre_resp = client.post(f'/api/preprocess?image_id={image_id}').json()
    assert pre_resp['status'] == 'preprocessed', f"Preprocess failed: {pre_resp}"
    print("[OK] Preprocess Test PASSED - Steps:", pre_resp['metadata']['steps'])

    # 4. Test /api/srm
    srm_resp = client.post(f'/api/srm?image_id={image_id}&scale_factor=2').json()
    assert srm_resp['status'] == 'completed', f"SRM failed: {srm_resp}"
    print("[OK] SRM Test PASSED - Scale factor:", srm_resp['srm_metadata']['scale_factor'])

    # 5. Test /api/classify
    class_resp = client.post(f'/api/classify?image_id={image_id}').json()
    assert class_resp['status'] == 'classified'
    print("[OK] Classify Test PASSED - Class:", class_resp['classification'])

    # 6. Test /api/risk
    risk_resp = client.post('/api/risk?thermal_intensity=320&hotspot_area_pct=1.5&classification=Industrial+Flare').json()
    assert risk_resp['status'] == 'computed'
    print("[OK] Risk Test PASSED - Index:", risk_resp['risk_index'], "Level:", risk_resp['risk_level'])

    # 7. Test /api/analyze (Unified endpoint)
    analyze_resp = client.post(f'/api/analyze?image_id={image_id}&scale_factor=2').json()
    assert analyze_resp['status'] == 'analysis_completed'
    assert 'srm' in analyze_resp
    assert 'classification' in analyze_resp
    assert 'risk' in analyze_resp
    print("[OK] Unified Analyze Test PASSED - Risk Level:", analyze_resp['risk']['risk_level'])

    print("\nALL IGNITE BACKEND ENDPOINTS & PIPELINES VERIFIED SUCCESSFULLY!")

if __name__ == '__main__':
    test_full_pipeline()
