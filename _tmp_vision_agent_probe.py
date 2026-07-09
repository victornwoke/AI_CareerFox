from vision_agent.server import app
from vision_agent.agent import create_agent, extract_session_context
from vision_agent.config import ServiceConfig

routes = sorted({route.path for route in app.routes if hasattr(route, 'path')})
assert '/health' in routes
assert '/sessions/start' in routes
assert '/sessions/{session_id}' in routes

context = extract_session_context({
    'customData': {
        'userId': 'user_123',
        'targetRole': 'Product Designer',
        'experienceLevel': 'mid',
        'practiceMode': 'mock_interview',
        'currentQuestion': 'Tell me about a time you handled conflict.',
        'jobDescription': 'Design mobile workflows for interview coaching.',
        'selectedCareerPath': 'Design',
    }
})

import os

config = ServiceConfig(
    stream_api_key=os.getenv('STREAM_API_KEY', 'stream-test-key'),
    stream_api_secret=os.getenv('STREAM_API_SECRET', 'stream-test-secret'),
    gemini_api_key=os.getenv('GEMINI_API_KEY', 'gemini-test-key'),
    google_api_key=os.getenv('GOOGLE_API_KEY', ''),
    gemini_model=os.getenv('GEMINI_MODEL', 'gemini-2.5-flash'),
)
agent = create_agent(context, config)
assert agent is not None
print('server_import_probe=ok')
print('agent_create_probe=ok')