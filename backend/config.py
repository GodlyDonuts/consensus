"""
Consensus Backend Configuration
Centralized configuration management for all services.
"""
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class DeepgramConfig:
    """Deepgram Speech-to-Text configuration."""
    api_key: str


@dataclass
class GCPConfig:
    """Google Cloud Platform configuration."""
    project_id: str
    region: str


@dataclass
class KafkaConfig:
    """Confluent Kafka configuration."""
    bootstrap_servers: str
    api_key: str
    api_secret: str
    topic_transcripts: str
    topic_insights: str
    
    def get_producer_config(self) -> dict:
        """Returns Kafka producer configuration."""
        return {
            'bootstrap.servers': self.bootstrap_servers,
            'security.protocol': 'SASL_SSL',
            'sasl.mechanisms': 'PLAIN',
            'sasl.username': self.api_key,
            'sasl.password': self.api_secret,
        }
    
    def get_consumer_config(self, group_id: str) -> dict:
        """Returns Kafka consumer configuration."""
        config = self.get_producer_config()
        config['group.id'] = group_id
        config['auto.offset.reset'] = 'earliest'
        return config


@dataclass
class AppConfig:
    """Main application configuration."""
    environment: str
    deepgram: DeepgramConfig
    gcp: GCPConfig
    kafka: KafkaConfig
    
    @property
    def is_production(self) -> bool:
        return self.environment == 'production'


def load_config() -> AppConfig:
    """Load and validate all configuration from environment variables."""
    
    environment = os.getenv('ENVIRONMENT', 'development')
    
    # Deepgram
    deepgram_key = os.getenv('DEEPGRAM_API_KEY')
    if not deepgram_key:
        print("WARNING: DEEPGRAM_API_KEY is missing")
    
    # GCP
    gcp_project = os.getenv('GCP_PROJECT_ID', 'consensus')
    gcp_region = os.getenv('GCP_REGION', 'us-central1')
    
    # Kafka
    kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', '')
    kafka_key = os.getenv('KAFKA_API_KEY', '')
    kafka_secret = os.getenv('KAFKA_API_SECRET', '')
    kafka_transcripts = os.getenv('KAFKA_TOPIC_TRANSCRIPTS', 'meeting-transcripts')
    kafka_insights = os.getenv('KAFKA_TOPIC_INSIGHTS', 'analysis-insights')
    
    return AppConfig(
        environment=environment,
        deepgram=DeepgramConfig(api_key=deepgram_key or ''),
        gcp=GCPConfig(project_id=gcp_project, region=gcp_region),
        kafka=KafkaConfig(
            bootstrap_servers=kafka_servers,
            api_key=kafka_key,
            api_secret=kafka_secret,
            topic_transcripts=kafka_transcripts,
            topic_insights=kafka_insights,
        ),
    )


# Global config instance
config = load_config()
