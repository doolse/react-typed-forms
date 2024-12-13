import {
  ChangeListenerFunc,
  collectChange,
  Control,
  ControlChange,
  setChangeCollector,
  Subscription,
} from "@astroapps/controls";

export class SubscriptionTracker {
  private _listener: ChangeListenerFunc<any> = (control, change) => {
    if (this.listener) this.listener(control, change);
  };
  listener?: ChangeListenerFunc<any>;
  changeListener: [ChangeListenerFunc<any>, (destroy?: boolean) => void];
  previousTracker?: ChangeListenerFunc<any>;

  constructor() {
    this.changeListener = makeChangeTracker(this._listener);
  }

  start() {
    this.previousTracker = collectChange;
    setChangeCollector(this.changeListener[0]);
  }

  run<V>(cb: () => V): V {
    this.start();
    try {
      return cb();
    } finally {
      this.stop();
    }
  }

  stop() {
    if (this.previousTracker) setChangeCollector(this.previousTracker);
    this.changeListener[1]();
  }

  destroy() {
    this.changeListener[1](true);
  }
}

type TrackedSubscription = [
  Control<any>,
  Subscription | undefined,
  ControlChange,
];

export function makeChangeTracker(
  listen: ChangeListenerFunc<any>,
): [ChangeListenerFunc<any>, (destroy?: boolean) => void] {
  let subscriptions: TrackedSubscription[] = [];
  return [
    (c, change) => {
      const existing = subscriptions.find((x) => x[0] === c);
      if (existing) {
        existing[2] |= change;
      } else {
        subscriptions.push([c, c.subscribe(listen, change), change]);
      }
    },
    (destroy) => {
      if (destroy) {
        subscriptions.forEach((x) => x[0].unsubscribe(listen));
        subscriptions = [];
        return;
      }
      let removed = false;
      subscriptions.forEach((sub) => {
        const [c, s, latest] = sub;
        if (s) {
          if (s.mask !== latest) {
            if (!latest) {
              removed = true;
              c.unsubscribe(s);
              sub[1] = undefined;
            } else s.mask = latest;
          }
        } else {
          sub[1] = c.subscribe(listen, latest);
        }
        sub[2] = 0;
      });
      if (removed) subscriptions = subscriptions.filter((x) => x[1]);
    },
  ];
}

export function collectChanges<A>(
  listener: ChangeListenerFunc<any>,
  run: () => A,
): A {
  const prevCollect = collectChange;
  setChangeCollector(listener);
  try {
    return run();
  } finally {
    setChangeCollector(prevCollect);
  }
}
