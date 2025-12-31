# PLAN: Consensus Cloud-Native Pivot
**Objective:** Transition "Consensus" from a monolithic Python app to an Event-Driven, Cloud-Native architecture to win the **Confluent Data Streaming Challenge** and **Google Cloud Center Stage** prize.

---

## 🏗 Phase 1: Infrastructure & Setup (GCP + Confluent)

The goal is to stop processing data in memory and start treating conversation as a "Stream."

- [ ] **Google Cloud Project**
    - [ ] Create new GCP Project: `consensus`.
    - [ ] Enable APIs: `Cloud Run`, `Vertex AI API`, `Firestore API`, `Container Registry API`.
    - [ ] Create a Service Account with `Vertex AI User` and `Firestore User` roles.

- [ ] **Confluent Cloud Setup**
    - [ ] Create a "Basic" Cluster (sufficient for hackathon).
    - [ ] **Create Topic A:** `meeting-transcripts` (Retention: 1 day).
        - *Purpose:* Raw text stream from Deepgram.
    - [ ] **Create Topic B:** `analysis-insights` (Retention: 1 day).
        - *Purpose:* Finished AI analysis ready to be sent back to the client.
    - [ ] Generate API Keys & Secrets.

- [ ] **Database (State Store)**
    - [ ] Initialize **Firestore** in Native Mode.
    - [ ] Design Schema:
        ```text
        Collection: meetings
          └── Document: {meeting_id}
                ├── Field: start_time
                ├── Field: is_active
                └── Subcollection: transcript_segments
        ```

---

## 🐍 Phase 2: Backend Decoupling (The "Split")

We must split `main.py` into two distinct services (or asynchronous loops) to demonstrate "Decoupled Architecture."

### 2.1. The Producer Service (Ingestion)
*Refactor existing `main.py` to strip out Gemini logic.*

- [ ] **Deepgram Integration**: Keep the WebSocket open for audio streaming.
- [ ] **Kafka Producer**:
    - [ ] Instead of appending to a local list, strictly **produce** every received transcript chunk to the `meeting-transcripts` Kafka topic.
    - [ ] Message format: `{"meeting_id": "xyz", "speaker": "unknown", "text": "Hello world", "timestamp": 12345}`.
- [ ] **Firestore Write**: Log the raw segment to Firestore for archival/history.

### 2.2. The Consumer Service (The AI Brain)
*Create new logic strictly for listening to the stream and triggering AI.*

- [ ] **Kafka Consumer**: Listen to `meeting-transcripts`.
- [ ] **Buffering Logic**:
    - [ ] Accumulate incoming messages locally or check Firestore count.
    - [ ] **Trigger:** When word count > 50 since last analysis.
- [ ] **Vertex AI Integration**:
    - [ ] Migrate from `google.generativeai` (API Key) to `google.cloud.vertexai` (ADC/IAM).
    - [ ] Send prompt + recent context to **Gemini 1.5 Flash**.
- [ ] **Kafka Producer (Loopback)**:
    - [ ] Publish the JSON Result to `analysis-insights`.

---

## 🧠 Phase 3: The "Confluent Challenge" Logic

This is the specific feature that wins the Confluent prize: **"Applying AI to Data in Motion."**

- [ ] **Implement "Rolling Context" via Stream**:
    - Instead of querying a DB for full context every time, try to maintain a "sliding window" of the conversation in the Consumer's memory, updating it with every Kafka message.
- [ ] **Real-Time Alerting**:
    - Ensure the Producer Service (Ingestion) subscribes to `analysis-insights` so it can push the alert back to the Frontend WebSocket immediately.

---

## 🚀 Phase 4: Deployment (Google Cloud Run)

We cannot run this on localhost for the demo. It needs to be cloud-native.

- [ ] **Dockerization**:
    - Create `Dockerfile` for the backend.
    - Ensure `gunicorn`/`uvicorn` is configured for port `8080`.
- [ ] **Deploy to Cloud Run**:
    ```bash
    gcloud run deploy consensus-backend \
      --source . \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars="GCP_PROJECT=consensus-hackathon,BOOTSTRAP_SERVERS=...,KAFKA_API_KEY=..."
    ```
- [ ] **Update Frontend**: Point the Chrome Extension `ws://` URL to the new Cloud Run domain.

---

## 🏁 Phase 5: Submission Polish

- [ ] **Visual Evidence**:
    - Screenshot the **Confluent Data Flow** UI (showing messages spiking during the demo).
    - Screenshot **GCP Log Explorer** showing Vertex AI calls.
- [ ] **README Update**:
    - Insert the new Architecture Diagram.
    - Explicitly list "Confluent" and "Vertex AI" in the technologies section.