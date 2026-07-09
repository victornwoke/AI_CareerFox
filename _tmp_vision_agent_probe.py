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

config = ServiceConfig(
    stream_api_key='stream-test-key',
    stream_api_secret='stream-test-secret',
    gemini_api_key='gemini-test-key',
    google_api_key='',
    gemini_model='gemini-2.5-flash',
)
agent = create_agent(context, config)
assert agent is not None
print('server_import_probe=ok')
print('agent_create_probe=ok')