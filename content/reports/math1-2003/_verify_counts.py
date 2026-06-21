import json

qr = json.load(open('D:/work/kaoyan/content/review/math1/2003/questions-reviewed.json', 'r', encoding='utf-8'))
ar = json.load(open('D:/work/kaoyan/content/review/math1/2003/anomalies-reviewed.json', 'r', encoding='utf-8'))

print(f"questions: total={qr['totalQuestions']}, len={len(qr['questions'])}, match={qr['totalQuestions']==len(qr['questions'])}")
print(f"anomalies: total={ar['totalAnomalies']}, len={len(ar['anomalies'])}, match={ar['totalAnomalies']==len(ar['anomalies'])}")
s = ar['anomaliesBySeverity']
print(f"severity: e={s['error']} w={s['warning']} i={s['info']} sum={s['error']+s['warning']+s['info']} match={s['error']+s['warning']+s['info']==ar['totalAnomalies']}")
print("VERIFIED_ALL")
