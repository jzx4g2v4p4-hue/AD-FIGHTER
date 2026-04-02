(function () {
  const STORAGE_KEY = 'ad_fighter_routine_v2';

  const STACKS = [
    {
      id: 'morning',
      title: 'Morning Stack',
      auto: true,
      items: [
        { id: 'hydrate', label: 'Drink water' },
        { id: 'wash-face', label: 'Wash face' },
        { id: 'eye-drops', label: 'Eye drops' },
        { id: 'vitamins', label: 'Vitamins' }
      ]
    },
    {
      id: 'shower',
      title: 'Shower Stack',
      auto: true,
      items: [
        { id: 'shower-on', label: 'Hot shower start' },
        { id: 'cleanse', label: 'Cleanse + rinse' },
        { id: 'shave-trim', label: 'Shaving / trimming' },
        { id: 'dry-off', label: 'Dry off + deodorant' }
      ]
    },
    {
      id: 'sticks',
      title: 'Sticks Stack',
      auto: true,
      items: [
        { id: 'sticks-setup', label: 'Prep sticks' },
        { id: 'minoxidil', label: 'Apply minoxidil (moved from standalone)' },
        { id: 'stick-finish', label: 'Finish stick routine' }
      ]
    },
    {
      id: 'two-by-two',
      title: '2x2 Stack (Callout Mode)',
      auto: true,
      items: [
        { id: 'focus-1', label: '2 min focus push #1' },
        { id: 'focus-2', label: '2 min focus push #2' },
        { id: 'callout', label: 'Self-callout: no excuses, finish the set' },
        { id: 'lock-in', label: 'Lock in next action immediately' }
      ]
    }
  ];

  function nowStamp() {
    return new Date().toLocaleString();
  }

  function buildInitialState() {
    return {
      stacks: STACKS.map((stack) => ({
        id: stack.id,
        activeIndex: 0,
        completed: {},
        history: []
      }))
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!parsed || !Array.isArray(parsed.stacks)) return buildInitialState();
      return parsed;
    } catch (err) {
      return buildInitialState();
    }
  }

  let state = loadState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function stackStateById(id) {
    return state.stacks.find((s) => s.id === id);
  }

  function completeItem(stackId, itemId) {
    const stackCfg = STACKS.find((s) => s.id === stackId);
    const stackState = stackStateById(stackId);
    if (!stackCfg || !stackState) return;

    if (stackState.completed[itemId]) return;

    stackState.completed[itemId] = true;
    const stamp = nowStamp();
    stackState.history.unshift(`${stamp}: ${itemId}`);

    const nextIndex = stackCfg.items.findIndex((item, idx) => idx > stackState.activeIndex && !stackState.completed[item.id]);
    stackState.activeIndex = nextIndex === -1 ? stackCfg.items.length : nextIndex;

    saveState();
    render();
  }

  function resetStack(stackId) {
    const stackState = stackStateById(stackId);
    if (!stackState) return;
    stackState.activeIndex = 0;
    stackState.completed = {};
    stackState.history = [];
    saveState();
    render();
  }

  function stackProgress(stackCfg, stackState) {
    const done = stackCfg.items.filter((item) => stackState.completed[item.id]).length;
    return `${done}/${stackCfg.items.length}`;
  }

  function createPanel() {
    const panel = document.createElement('aside');
    panel.id = 'routinePanel';
    document.body.appendChild(panel);
    return panel;
  }

  const panel = createPanel();

  function render() {
    panel.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = 'Routine Stacks';
    panel.appendChild(title);

    STACKS.forEach((stackCfg) => {
      const stackState = stackStateById(stackCfg.id);
      const card = document.createElement('section');
      card.className = 'routine-stack';

      const head = document.createElement('div');
      head.className = 'routine-head';
      head.innerHTML = `<strong>${stackCfg.title}</strong><span>AUTO: ON • ${stackProgress(stackCfg, stackState)}</span>`;
      card.appendChild(head);

      const list = document.createElement('ol');
      list.className = 'routine-list';

      stackCfg.items.forEach((item, idx) => {
        const done = !!stackState.completed[item.id];
        const isActive = idx === stackState.activeIndex && !done;

        const li = document.createElement('li');
        li.className = `routine-item ${done ? 'done' : ''} ${isActive ? 'active' : ''}`;

        const label = document.createElement('span');
        label.textContent = item.label;

        const btn = document.createElement('button');
        btn.textContent = done ? 'Done' : 'Complete';
        btn.disabled = done || (!isActive && stackCfg.auto);
        btn.addEventListener('click', () => completeItem(stackCfg.id, item.id));

        li.append(label, btn);
        list.appendChild(li);
      });

      card.appendChild(list);

      const footer = document.createElement('div');
      footer.className = 'routine-footer';
      const resetBtn = document.createElement('button');
      resetBtn.textContent = 'Reset Stack';
      resetBtn.addEventListener('click', () => resetStack(stackCfg.id));

      const history = document.createElement('small');
      history.textContent = stackState.history[0] ? `Last tracked: ${stackState.history[0]}` : 'No tracked actions yet';

      footer.append(resetBtn, history);
      card.appendChild(footer);
      panel.appendChild(card);
    });
  }

  render();
})();
