#!/usr/bin/env python3
"""
seed-latin-execute.py
Reads LAT_A11..LAT_B13 from the existing data scripts and runs UPDATE against DB.
"""
import sys, os, psycopg2, json

DB_URL = "postgresql://neondb_owner:npg_wRBXT6Azv0Vj@ep-late-sea-aqyed9xw-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# ── import data from existing scripts ─────────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))
from seed_ai_context import LAT_A11, LAT_A12, LAT_A21, LAT_A22
from seed_ai_context_b1_greek import LAT_B11, LAT_B12, LAT_B13

# ── lesson IDs in sortOrder ────────────────────────────────────────────────────
IDS = {
  'lat-a11': [
    '1fa9326f-871d-497b-ac7e-29cad074c8b4',
    '147acbf2-b609-45d4-a0fe-067dd2c0e722',
    '2e9aaadd-14ce-474f-945a-294957f8b76a',
    '4c716af3-6392-4b97-8bbe-f4a50c2d48d4',
    'd40db1de-f1e1-4b6c-81b3-142452c11544',
    '5c47963b-3f17-43a7-92de-da332be4314b',
    '30f3b2bd-c344-42dc-9982-a4c732c11a07',
    '504f5429-cfb4-46e1-bcd0-8a8e69067a97',
    'c5e44bc7-b62e-4913-b11d-eaa77c5add03',
    '2e97a173-bcf6-41e3-9b30-92f141e28462',
    '58ce443c-b517-4c75-8562-74ba99486331',
    'f20f9647-d3ac-4059-8661-89b40a6ee8c0',
    'ee4752ae-1292-4c87-896b-3bfa22818069',
  ],
  'lat-a12': [
    '7fd80e2d-692d-4220-a057-2b12e0800248',
    '6b49fffd-fd20-46af-9587-8a3d1aaf0c39',
    '4913f42d-2141-4a81-bb64-3446f011e264',
    'b94313a6-cd6c-4b6d-8009-490c22a92019',
    '236c5ade-9962-4191-93a9-3c7c09bdb038',
    'e304ce02-6f31-418e-a86e-cabe893a7cc9',
    'ee05d6d3-c667-4ea9-971e-ce4e35645dc5',
    '0969ed89-9e6a-4055-acff-5c7f8d4ff6e1',
    '1c3922ca-54fd-49eb-ab2b-ab3aa3160e10',
    '2d0da3ab-5730-419b-b216-a1506d6b644c',
    '5b4fda7f-2e5f-4063-8cb9-d03e5a5205aa',
    'c5b5be22-b0d4-4166-9fff-972a8798ba1a',
  ],
  'lat-a21': [
    '2b46a460-9622-46d5-b0ce-ce055b2f1095',
    'f95e3fbd-c286-4152-a024-608336b9eca0',
    'd281ff11-f38b-4313-a853-bdbc8eb21233',
    '949ccff0-a9dc-4490-bdaf-a829d25996c5',
    '3bafb364-9de4-432d-a504-e9c341dc7c4a',
    'd0ea6ba8-38c7-42e4-90bb-4adf8b6c648a',
    '5cf8af09-96e5-4f92-9e84-8afc6c20ec4d',
    'f73a268c-53e6-45f2-9ff3-b4039df310d8',
    '8aafea7b-c0aa-44db-80c2-a08691f8e750',
    'b1878ad5-66f7-4e46-b0fe-3869f5213675',
    'b4880493-fdfc-4423-b838-d3399f23c470',
    'bd7fa2b2-0c0c-4198-b57e-5fd296febed0',
    '714f9cb3-bb9c-4ca2-9fc7-cfe68cab7682',
  ],
  'lat-a22': [
    '27accdb4-6a24-4a07-8dcb-05ce56283132',
    'fc4fc03c-b22e-47cc-8e84-ed935df8c1c9',
    'a21f9f9e-87bc-4a2b-9eb1-38599a055571',
    '59dce033-2821-40ee-b88d-11a2e79cd590',
    '34afb997-40d1-4041-8979-2e02d8d6cf83',
    '56616f52-d890-4ca7-9b7b-7603089b88ba',
    '5d38fd49-6862-41dc-8c3a-647a1b2c5d07',
    '3bd5afe7-b251-461c-8e11-77bd4da3cba1',
    '6893361d-bea4-466c-9e9b-3a750258ca77',
    '7501c8a6-fc17-4e1d-97f6-e9875be1baf1',
    'cbc18e6d-3f86-4d08-b099-91cbe983e84c',
    '331bb879-4bf2-4fd4-8942-17aec324f370',
  ],
  'lat-b11': [
    '3aba8509-4464-4731-a3c8-3ec5206a82ca',
    'f7b47576-a5f3-407e-9541-fd459b212fd4',
    'c72b6377-81e8-430a-bf8c-2fd5be5a49be',
    '2a612593-f217-4959-8b96-d240678b6b9e',
    '06c29278-5159-4b6c-9334-4186dc15d9cd',
    '0b61f126-cc7a-4aaa-b8e6-d4a6680ac0df',
    '8946a406-3ae2-4cca-879f-39a069e7ee58',
    '5569777d-3738-4b24-89af-c48f3c49d46f',
    'a04ba5e9-612d-4380-9bce-404bfce3f566',
    'f1762923-1aa1-4664-bed1-31473ba8e98a',
    'ddc8ba3e-7090-4e22-b594-3806d544f95b',
    'f29a92c9-beb9-495c-83c6-f6022507ae4c',
    'dd80a789-94a1-49eb-85d6-9192cec471d3',
    '953d17e5-7a63-4447-b624-19904bcda6e1',
    'e0f3214d-1384-4153-a5ba-0d5bb41b0b2c',
    '3ac287c8-2b72-4055-96de-fd0dad014593',
    'bcd26334-8d65-493f-aca1-0427b589a651',
    'a5ded3c0-bfb6-4c3c-ac90-bf8283471e03',
  ],
  'lat-b12': [
    'fe556b13-d8cd-4238-9fd8-2792caa25069',
    'ec80dccb-8621-4b64-a1a0-9c88c6836bdf',
    '2db090e3-1acb-411b-8bcf-83bc222219b7',
    '77bddde3-4d4f-49bc-a270-68db31415a94',
    'db7e9786-427b-4150-befc-979b20d3f62e',
    '116ab28e-6e56-4d78-a17f-c4366f8f0a50',
    'a60bf0ef-1358-4484-bb57-1e51b3693134',
    'c52791cc-6735-4b36-af7e-c460a3e30c4d',
    'f8b2d8d3-7e04-44d1-a2c3-c9a3de5ecff9',
    'd3306c89-6917-41a1-9259-1a8ac4efa480',
    '9858636c-d852-4c9a-8266-dca6cf15c1f3',
    '4be00df6-1e20-44e0-980b-989e5850529f',
    '4c2ac78e-99c2-4414-92ab-01908d1610ba',
    'f0c2d5ce-3583-418a-8356-16853aa42155',
    'fcd04a73-6e75-4724-8e81-afb828d43d06',
    'abc62e96-781c-4bb2-b44b-6dfc2c20d6c4',
    'b9886d39-cd99-4e23-b7be-eaf2fd3c7c1e',
  ],
  'lat-b13': [
    '0dbd4670-207d-4528-ba3a-8081a6025dba',
    '9fdfb4c7-8f71-4f37-8989-17bd57fb37b0',
    '171eb345-9f7e-4527-be72-b42dfedbbe90',
    '019918cd-4ca5-40af-9254-46a38b4c65cf',
    '1e28695a-a3dd-4445-a67c-093339d33960',
    '4e4f9827-85fd-4fea-8f4c-3d73309b7b7f',
    'd3f3b9e1-86d2-4632-acae-76a1469e761a',
    '1b328650-08a4-444a-8164-21ca6303a049',
    '2f85cc85-9b7f-4e31-97bd-4e7dbeedc719',
    'ba8ad262-7f64-414e-8299-d3afb4e6b986',
    'f77a7564-21d6-4771-8a2d-baf4dbd0bb9a',
    '2df52244-3599-4097-a10c-80f6560117e6',
    'b130bcdc-bdce-4da2-9a23-2967a0b6373e',
    '66585e17-3da3-4972-ba64-58292c346745',
    '834e8351-8ffa-4e1d-bdf4-cfdfaebba9a2',
    '313f04ad-99f5-404e-8edb-6fafc8fce057',
  ],
}

DATASETS = [
  ('lat-a11', LAT_A11),
  ('lat-a12', LAT_A12),
  ('lat-a21', LAT_A21),
  ('lat-a22', LAT_A22),
  ('lat-b11', LAT_B11),
  ('lat-b12', [
    # Lezione 0: materiale introduttivo del corso B1.2
    {"textFragment": "Cursus B1.2 Linguae Latinae: Vergilius, Horatius, Ovidius, Livius, Tacitus. Haec legio auctorum Romanorum fundamentum est. Studia felicia!", "contentSummary": "Lezione introduttiva del corso Lat-B1.2. Presenta il programma del corso, gli autori che saranno affrontati (Virgilio, Orazio, Ovidio, Livio, Tacito) e le competenze attese. Contiene il materiale didattico di base per l'accesso al corso.", "keyVocabulary": [{"term": "cursus", "meaning": "corso, percorso"}, {"term": "studia", "meaning": "studi"}, {"term": "auctor", "meaning": "autore"}, {"term": "felicia", "meaning": "felici, propizi"}], "learningObjectives": "Lo studente prende visione del programma del corso B1.2. Conosce gli autori che saranno affrontati. Accede al materiale didattico introduttivo. Si prepara al percorso di lettura dei grandi autori della letteratura latina."},
  ] + LAT_B12),
  ('lat-b13', LAT_B13),
]

def run():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    total = 0
    for slug, data in DATASETS:
        ids = IDS[slug]
        assert len(ids) == len(data), f"{slug}: {len(ids)} IDs vs {len(data)} records"
        for lid, lesson in zip(ids, data):
            cur.execute("""
                UPDATE "Lesson"
                SET "textFragment"=%s, "contentSummary"=%s,
                    "keyVocabulary"=%s::jsonb, "learningObjectives"=%s
                WHERE id=%s
            """, (
                lesson["textFragment"],
                lesson["contentSummary"],
                json.dumps(lesson["keyVocabulary"], ensure_ascii=False),
                lesson["learningObjectives"],
                lid
            ))
            total += 1
        print(f"  ✓ {slug}: {len(data)} lezioni")
    conn.commit()
    conn.close()
    print(f"\nTotale: {total} lezioni latine aggiornate")

if __name__ == "__main__":
    run()
