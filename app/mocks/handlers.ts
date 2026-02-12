import { http, HttpResponse } from 'msw';

const mockPlans = [
  {
    id: 'plan-1',
    title: 'Weekend Adventure',
    description: 'A fun weekend outing',
    theme: 'adventure',
    user_id: 'user-1',
    is_public: false,
    event_count: 1,
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
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockBranches: Record<string, unknown>[] = [];
const mockBranchOptions: Record<string, unknown>[] = [];

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

  // Reorder events API
  http.post('/api/events/reorder', async ({ request }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await request.json() as any;
    const { eventIds } = body;
    if (Array.isArray(eventIds)) {
      eventIds.forEach((id: string, index: number) => {
        const ev = mockEvents.find(e => e.id === id);
        if (ev) ev.position = index;
      });
    }
    return HttpResponse.json({ success: true });
  }),

  // Branches API
  http.post('/api/branches', async ({ request }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await request.json() as any;
    const newBranch = {
      id: `branch-${Date.now()}`,
      plan_id: body.planId,
      title: body.title,
      description: body.description || null,
      previous_event_id: body.previousEventId || null,
      next_event_id: body.nextEventId || null,
      options: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockBranches.push(newBranch);
    return HttpResponse.json(newBranch, { status: 201 });
  }),

  http.patch('/api/branches/:id', async ({ params, request }) => {
    const { id } = params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await request.json() as any;
    const branchIndex = mockBranches.findIndex(b => b.id === id);
    if (branchIndex === -1) {
      return HttpResponse.json({ error: 'Branch not found' }, { status: 404 });
    }
    mockBranches[branchIndex] = {
      ...mockBranches[branchIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(mockBranches[branchIndex]);
  }),

  http.delete('/api/branches/:id', ({ params }) => {
    const { id } = params;
    const branchIndex = mockBranches.findIndex(b => b.id === id);
    if (branchIndex === -1) {
      return HttpResponse.json({ error: 'Branch not found' }, { status: 404 });
    }
    mockBranches.splice(branchIndex, 1);
    return HttpResponse.json({ success: true });
  }),

  // Branch options API
  http.post('/api/branches/:id/options', async ({ params, request }) => {
    const { id: branchId } = params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await request.json() as any;
    const newOption = {
      id: `option-${Date.now()}`,
      branch_id: branchId,
      label: body.label,
      description: body.description || null,
      decision_logic: body.decisionLogic || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockBranchOptions.push(newOption);
    return HttpResponse.json(newOption, { status: 201 });
  }),
];
