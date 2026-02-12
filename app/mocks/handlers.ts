import { http, HttpResponse } from 'msw';

const mockPlans = [
  {
    id: 'plan-1',
    title: 'Weekend Adventure',
    description: 'A fun weekend outing',
    theme: 'adventure',
    user_id: 'user-1',
    is_public: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    collaborators: [],
  },
];

const mockEvents = [
  {
    id: 'event-1',
    plan_id: 'plan-1',
    title: 'Morning Coffee',
    description: 'Start the day at a local cafe',
    location: 'Corner Cafe',
    start_time: '09:00',
    end_time: '10:00',
    duration: 60,
    notes: 'Try their specialty blend',
    tags: ['coffee', 'morning'],
    is_optional: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const handlers = [
  // Plans API
  http.get('/api/plans', () => {
    return HttpResponse.json(mockPlans);
  }),

  http.get('/api/plans/:id', ({ params }) => {
    const { id } = params;
    const plan = mockPlans.find(p => p.id === id);
    
    if (!plan) {
      return HttpResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const events = mockEvents.filter(e => e.plan_id === id);
    
    return HttpResponse.json({
      ...plan,
      events,
      branches: [],
      collaborators: [],
    });
  }),

  http.post('/api/plans', async ({ request }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await request.json() as any;
    const newPlan = {
      id: `plan-${Date.now()}`,
      ...body,
      user_id: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      collaborators: [],
    };
    mockPlans.push(newPlan);
    return HttpResponse.json(newPlan, { status: 201 });
  }),

  http.patch('/api/plans/:id', async ({ params, request }) => {
    const { id } = params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await request.json() as any;
    const planIndex = mockPlans.findIndex(p => p.id === id);
    
    if (planIndex === -1) {
      return HttpResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    mockPlans[planIndex] = {
      ...mockPlans[planIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json(mockPlans[planIndex]);
  }),

  http.delete('/api/plans/:id', ({ params }) => {
    const { id } = params;
    const planIndex = mockPlans.findIndex(p => p.id === id);
    
    if (planIndex === -1) {
      return HttpResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    mockPlans.splice(planIndex, 1);
    return HttpResponse.json({ success: true });
  }),

  // Events API
  http.post('/api/events', async ({ request }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await request.json() as any;
    const newEvent = {
      id: `event-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockEvents.push(newEvent);
    return HttpResponse.json(newEvent, { status: 201 });
  }),

  http.patch('/api/events/:id', async ({ params, request }) => {
    const { id } = params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await request.json() as any;
    const eventIndex = mockEvents.findIndex(e => e.id === id);
    
    if (eventIndex === -1) {
      return HttpResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    mockEvents[eventIndex] = {
      ...mockEvents[eventIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json(mockEvents[eventIndex]);
  }),

  http.delete('/api/events/:id', ({ params }) => {
    const { id } = params;
    const eventIndex = mockEvents.findIndex(e => e.id === id);
    
    if (eventIndex === -1) {
      return HttpResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    mockEvents.splice(eventIndex, 1);
    return HttpResponse.json({ success: true });
  }),

  // Auth API
  http.post('/api/auth/signin', async ({ request }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await request.json() as any;
    
    if (body.email && body.password) {
      return HttpResponse.json({
        user: {
          id: 'user-1',
          email: body.email,
          name: 'Test User',
        },
      });
    }
    
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),
];
