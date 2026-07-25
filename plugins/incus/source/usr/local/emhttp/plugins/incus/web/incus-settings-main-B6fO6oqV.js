/**
* @vue/shared v3.5.39
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function ur(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const s of e.split(",")) t[s] = 1;
  return (s) => s in t;
}
const me = {}, Es = [], Mt = () => {
}, Fl = () => !1, io = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), ao = (e) => e.startsWith("onUpdate:"), Be = Object.assign, dr = (e, t) => {
  const s = e.indexOf(t);
  s > -1 && e.splice(s, 1);
}, Qa = Object.prototype.hasOwnProperty, ve = (e, t) => Qa.call(e, t), J = Array.isArray, Is = (e) => En(e) === "[object Map]", js = (e) => En(e) === "[object Set]", Zr = (e) => En(e) === "[object Date]", X = (e) => typeof e == "function", Ve = (e) => typeof e == "string", pt = (e) => typeof e == "symbol", xe = (e) => e !== null && typeof e == "object", Hl = (e) => (xe(e) || X(e)) && X(e.then) && X(e.catch), zl = Object.prototype.toString, En = (e) => zl.call(e), Za = (e) => En(e).slice(8, -1), uo = (e) => En(e) === "[object Object]", co = (e) => Ve(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, mn = /* @__PURE__ */ ur(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), fo = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((s) => t[s] || (t[s] = e(s)));
}, Xa = /-\w/g, Ge = fo(
  (e) => e.replace(Xa, (t) => t.slice(1).toUpperCase())
), eu = /\B([A-Z])/g, ut = fo(
  (e) => e.replace(eu, "-$1").toLowerCase()
), Wl = fo((e) => e.charAt(0).toUpperCase() + e.slice(1)), Gn = fo(
  (e) => e ? `on${Wl(e)}` : ""
), Ke = (e, t) => !Object.is(e, t), Jn = (e, ...t) => {
  for (let s = 0; s < e.length; s++)
    e[s](...t);
}, ql = (e, t, s, n = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: n,
    value: s
  });
}, po = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, Xr = (e) => {
  const t = Ve(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let el;
const mo = () => el || (el = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function _n(e) {
  if (J(e)) {
    const t = {};
    for (let s = 0; s < e.length; s++) {
      const n = e[s], o = Ve(n) ? ou(n) : _n(n);
      if (o)
        for (const l in o)
          t[l] = o[l];
    }
    return t;
  } else if (Ve(e) || xe(e))
    return e;
}
const tu = /;(?![^(]*\))/g, su = /:([^]+)/, nu = /\/\*[^]*?\*\//g;
function ou(e) {
  const t = {};
  return e.replace(nu, "").split(tu).forEach((s) => {
    if (s) {
      const n = s.split(su);
      n.length > 1 && (t[n[0].trim()] = n[1].trim());
    }
  }), t;
}
function ot(e) {
  let t = "";
  if (Ve(e))
    t = e;
  else if (J(e))
    for (let s = 0; s < e.length; s++) {
      const n = ot(e[s]);
      n && (t += n + " ");
    }
  else if (xe(e))
    for (const s in e)
      e[s] && (t += s + " ");
  return t.trim();
}
const ru = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", lu = /* @__PURE__ */ ur(ru);
function Kl(e) {
  return !!e || e === "";
}
function iu(e, t) {
  if (e.length !== t.length) return !1;
  let s = !0;
  for (let n = 0; s && n < e.length; n++)
    s = ts(e[n], t[n]);
  return s;
}
function ts(e, t) {
  if (e === t) return !0;
  let s = Zr(e), n = Zr(t);
  if (s || n)
    return s && n ? e.getTime() === t.getTime() : !1;
  if (s = pt(e), n = pt(t), s || n)
    return e === t;
  if (s = J(e), n = J(t), s || n)
    return s && n ? iu(e, t) : !1;
  if (s = xe(e), n = xe(t), s || n) {
    if (!s || !n)
      return !1;
    const o = Object.keys(e).length, l = Object.keys(t).length;
    if (o !== l)
      return !1;
    for (const i in e) {
      const a = e.hasOwnProperty(i), u = t.hasOwnProperty(i);
      if (a && !u || !a && u || !ts(e[i], t[i]))
        return !1;
    }
  }
  return String(e) === String(t);
}
function cr(e, t) {
  return e.findIndex((s) => ts(s, t));
}
const Gl = (e) => !!(e && e.__v_isRef === !0), M = (e) => Ve(e) ? e : e == null ? "" : J(e) || xe(e) && (e.toString === zl || !X(e.toString)) ? Gl(e) ? M(e.value) : JSON.stringify(e, Jl, 2) : String(e), Jl = (e, t) => Gl(t) ? Jl(e, t.value) : Is(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (s, [n, o], l) => (s[jo(n, l) + " =>"] = o, s),
    {}
  )
} : js(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((s) => jo(s))
} : pt(t) ? jo(t) : xe(t) && !J(t) && !uo(t) ? String(t) : t, jo = (e, t = "") => {
  var s;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    pt(e) ? `Symbol(${(s = e.description) != null ? s : t})` : e
  );
};
/**
* @vue/reactivity v3.5.39
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let qe;
class au {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && qe && (qe.active ? (this.parent = qe, this.index = (qe.scopes || (qe.scopes = [])).push(
      this
    ) - 1) : (this._active = !1, this._warnOnRun = !1));
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, s;
      if (this.scopes)
        for (t = 0, s = this.scopes.length; t < s; t++)
          this.scopes[t].pause();
      for (t = 0, s = this.effects.length; t < s; t++)
        this.effects[t].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, s;
      if (this.scopes)
        for (t = 0, s = this.scopes.length; t < s; t++)
          this.scopes[t].resume();
      for (t = 0, s = this.effects.length; t < s; t++)
        this.effects[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const s = qe;
      try {
        return qe = this, t();
      } finally {
        qe = s;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = qe, qe = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (qe === this)
        qe = this.prevScope;
      else {
        let t = qe;
        for (; t; ) {
          if (t.prevScope === this) {
            t.prevScope = this.prevScope;
            break;
          }
          t = t.prevScope;
        }
      }
      this.prevScope = void 0;
    }
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let s, n;
      for (s = 0, n = this.effects.length; s < n; s++)
        this.effects[s].stop();
      for (this.effects.length = 0, s = 0, n = this.cleanups.length; s < n; s++)
        this.cleanups[s]();
      if (this.cleanups.length = 0, this.scopes) {
        for (s = 0, n = this.scopes.length; s < n; s++)
          this.scopes[s].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const o = this.parent.scopes.pop();
        o && o !== this && (this.parent.scopes[this.index] = o, o.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function uu() {
  return qe;
}
let Se;
const No = /* @__PURE__ */ new WeakSet();
class Yl {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, qe && (qe.active ? qe.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, No.has(this) && (No.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || Zl(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, tl(this), Xl(this);
    const t = Se, s = xt;
    Se = this, xt = !0;
    try {
      return this.fn();
    } finally {
      ei(this), Se = t, xt = s, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        mr(t);
      this.deps = this.depsTail = void 0, tl(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? No.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    Qo(this) && this.run();
  }
  get dirty() {
    return Qo(this);
  }
}
let Ql = 0, gn, hn;
function Zl(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = hn, hn = e;
    return;
  }
  e.next = gn, gn = e;
}
function fr() {
  Ql++;
}
function pr() {
  if (--Ql > 0)
    return;
  if (hn) {
    let t = hn;
    for (hn = void 0; t; ) {
      const s = t.next;
      t.next = void 0, t.flags &= -9, t = s;
    }
  }
  let e;
  for (; gn; ) {
    let t = gn;
    for (gn = void 0; t; ) {
      const s = t.next;
      if (t.next = void 0, t.flags &= -9, t.flags & 1)
        try {
          t.trigger();
        } catch (n) {
          e || (e = n);
        }
      t = s;
    }
  }
  if (e) throw e;
}
function Xl(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function ei(e) {
  let t, s = e.depsTail, n = s;
  for (; n; ) {
    const o = n.prevDep;
    n.version === -1 ? (n === s && (s = o), mr(n), du(n)) : t = n, n.dep.activeLink = n.prevActiveLink, n.prevActiveLink = void 0, n = o;
  }
  e.deps = t, e.depsTail = s;
}
function Qo(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (ti(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function ti(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === wn) || (e.globalVersion = wn, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Qo(e))))
    return;
  e.flags |= 2;
  const t = e.dep, s = Se, n = xt;
  Se = e, xt = !0;
  try {
    Xl(e);
    const o = e.fn(e._value);
    (t.version === 0 || Ke(o, e._value)) && (e.flags |= 128, e._value = o, t.version++);
  } catch (o) {
    throw t.version++, o;
  } finally {
    Se = s, xt = n, ei(e), e.flags &= -3;
  }
}
function mr(e, t = !1) {
  const { dep: s, prevSub: n, nextSub: o } = e;
  if (n && (n.nextSub = o, e.prevSub = void 0), o && (o.prevSub = n, e.nextSub = void 0), s.subs === e && (s.subs = n, !n && s.computed)) {
    s.computed.flags &= -5;
    for (let l = s.computed.deps; l; l = l.nextDep)
      mr(l, !0);
  }
  !t && !--s.sc && s.map && s.map.delete(s.key);
}
function du(e) {
  const { prevDep: t, nextDep: s } = e;
  t && (t.nextDep = s, e.prevDep = void 0), s && (s.prevDep = t, e.nextDep = void 0);
}
let xt = !0;
const si = [];
function $t() {
  si.push(xt), xt = !1;
}
function Vt() {
  const e = si.pop();
  xt = e === void 0 ? !0 : e;
}
function tl(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const s = Se;
    Se = void 0;
    try {
      t();
    } finally {
      Se = s;
    }
  }
}
let wn = 0;
class cu {
  constructor(t, s) {
    this.sub = t, this.dep = s, this.version = s.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class go {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!Se || !xt || Se === this.computed)
      return;
    let s = this.activeLink;
    if (s === void 0 || s.sub !== Se)
      s = this.activeLink = new cu(Se, this), Se.deps ? (s.prevDep = Se.depsTail, Se.depsTail.nextDep = s, Se.depsTail = s) : Se.deps = Se.depsTail = s, ni(s);
    else if (s.version === -1 && (s.version = this.version, s.nextDep)) {
      const n = s.nextDep;
      n.prevDep = s.prevDep, s.prevDep && (s.prevDep.nextDep = n), s.prevDep = Se.depsTail, s.nextDep = void 0, Se.depsTail.nextDep = s, Se.depsTail = s, Se.deps === s && (Se.deps = n);
    }
    return s;
  }
  trigger(t) {
    this.version++, wn++, this.notify(t);
  }
  notify(t) {
    fr();
    try {
      for (let s = this.subs; s; s = s.prevSub)
        s.sub.notify() && s.sub.dep.notify();
    } finally {
      pr();
    }
  }
}
function ni(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let n = t.deps; n; n = n.nextDep)
        ni(n);
    }
    const s = e.dep.subs;
    s !== e && (e.prevSub = s, s && (s.nextSub = e)), e.dep.subs = e;
  }
}
const Zn = /* @__PURE__ */ new WeakMap(), ps = /* @__PURE__ */ Symbol(
  ""
), Zo = /* @__PURE__ */ Symbol(
  ""
), kn = /* @__PURE__ */ Symbol(
  ""
);
function Ze(e, t, s) {
  if (xt && Se) {
    let n = Zn.get(e);
    n || Zn.set(e, n = /* @__PURE__ */ new Map());
    let o = n.get(s);
    o || (n.set(s, o = new go()), o.map = n, o.key = s), o.track();
  }
}
function Wt(e, t, s, n, o, l) {
  const i = Zn.get(e);
  if (!i) {
    wn++;
    return;
  }
  const a = (u) => {
    u && u.trigger();
  };
  if (fr(), t === "clear")
    i.forEach(a);
  else {
    const u = J(e), h = u && co(s);
    if (u && s === "length") {
      const g = Number(n);
      i.forEach((x, A) => {
        (A === "length" || A === kn || !pt(A) && A >= g) && a(x);
      });
    } else
      switch ((s !== void 0 || i.has(void 0)) && a(i.get(s)), h && a(i.get(kn)), t) {
        case "add":
          u ? h && a(i.get("length")) : (a(i.get(ps)), Is(e) && a(i.get(Zo)));
          break;
        case "delete":
          u || (a(i.get(ps)), Is(e) && a(i.get(Zo)));
          break;
        case "set":
          Is(e) && a(i.get(ps));
          break;
      }
  }
  pr();
}
function fu(e, t) {
  const s = Zn.get(e);
  return s && s.get(t);
}
function Ss(e) {
  const t = /* @__PURE__ */ be(e);
  return t === e ? t : (Ze(t, "iterate", kn), /* @__PURE__ */ ft(e) ? t : t.map(_t));
}
function ho(e) {
  return Ze(e = /* @__PURE__ */ be(e), "iterate", kn), e;
}
function Pt(e, t) {
  return /* @__PURE__ */ Jt(e) ? $s(/* @__PURE__ */ ms(e) ? _t(t) : t) : _t(t);
}
const pu = {
  __proto__: null,
  [Symbol.iterator]() {
    return Lo(this, Symbol.iterator, (e) => Pt(this, e));
  },
  concat(...e) {
    return Ss(this).concat(
      ...e.map((t) => J(t) ? Ss(t) : t)
    );
  },
  entries() {
    return Lo(this, "entries", (e) => (e[1] = Pt(this, e[1]), e));
  },
  every(e, t) {
    return Dt(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return Dt(
      this,
      "filter",
      e,
      t,
      (s) => s.map((n) => Pt(this, n)),
      arguments
    );
  },
  find(e, t) {
    return Dt(
      this,
      "find",
      e,
      t,
      (s) => Pt(this, s),
      arguments
    );
  },
  findIndex(e, t) {
    return Dt(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return Dt(
      this,
      "findLast",
      e,
      t,
      (s) => Pt(this, s),
      arguments
    );
  },
  findLastIndex(e, t) {
    return Dt(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return Dt(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return Uo(this, "includes", e);
  },
  indexOf(...e) {
    return Uo(this, "indexOf", e);
  },
  join(e) {
    return Ss(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return Uo(this, "lastIndexOf", e);
  },
  map(e, t) {
    return Dt(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return on(this, "pop");
  },
  push(...e) {
    return on(this, "push", e);
  },
  reduce(e, ...t) {
    return sl(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return sl(this, "reduceRight", e, t);
  },
  shift() {
    return on(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return Dt(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return on(this, "splice", e);
  },
  toReversed() {
    return Ss(this).toReversed();
  },
  toSorted(e) {
    return Ss(this).toSorted(e);
  },
  toSpliced(...e) {
    return Ss(this).toSpliced(...e);
  },
  unshift(...e) {
    return on(this, "unshift", e);
  },
  values() {
    return Lo(this, "values", (e) => Pt(this, e));
  }
};
function Lo(e, t, s) {
  const n = ho(e), o = n[t]();
  return n !== e && !/* @__PURE__ */ ft(e) && (o._next = o.next, o.next = () => {
    const l = o._next();
    return l.done || (l.value = s(l.value)), l;
  }), o;
}
const mu = Array.prototype;
function Dt(e, t, s, n, o, l) {
  const i = ho(e), a = i !== e && !/* @__PURE__ */ ft(e), u = i[t];
  if (u !== mu[t]) {
    const x = u.apply(e, l);
    return a ? _t(x) : x;
  }
  let h = s;
  i !== e && (a ? h = function(x, A) {
    return s.call(this, Pt(e, x), A, e);
  } : s.length > 2 && (h = function(x, A) {
    return s.call(this, x, A, e);
  }));
  const g = u.call(i, h, n);
  return a && o ? o(g) : g;
}
function sl(e, t, s, n) {
  const o = ho(e), l = o !== e && !/* @__PURE__ */ ft(e);
  let i = s, a = !1;
  o !== e && (l ? (a = n.length === 0, i = function(h, g, x) {
    return a && (a = !1, h = Pt(e, h)), s.call(this, h, Pt(e, g), x, e);
  }) : s.length > 3 && (i = function(h, g, x) {
    return s.call(this, h, g, x, e);
  }));
  const u = o[t](i, ...n);
  return a ? Pt(e, u) : u;
}
function Uo(e, t, s) {
  const n = /* @__PURE__ */ be(e);
  Ze(n, "iterate", kn);
  const o = n[t](...s);
  return (o === -1 || o === !1) && /* @__PURE__ */ bo(s[0]) ? (s[0] = /* @__PURE__ */ be(s[0]), n[t](...s)) : o;
}
function on(e, t, s = []) {
  $t(), fr();
  const n = (/* @__PURE__ */ be(e))[t].apply(e, s);
  return pr(), Vt(), n;
}
const gu = /* @__PURE__ */ ur("__proto__,__v_isRef,__isVue"), oi = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(pt)
);
function hu(e) {
  pt(e) || (e = String(e));
  const t = /* @__PURE__ */ be(this);
  return Ze(t, "has", e), t.hasOwnProperty(e);
}
class ri {
  constructor(t = !1, s = !1) {
    this._isReadonly = t, this._isShallow = s;
  }
  get(t, s, n) {
    if (s === "__v_skip") return t.__v_skip;
    const o = this._isReadonly, l = this._isShallow;
    if (s === "__v_isReactive")
      return !o;
    if (s === "__v_isReadonly")
      return o;
    if (s === "__v_isShallow")
      return l;
    if (s === "__v_raw")
      return n === (o ? l ? Au : ui : l ? ai : ii).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(n) ? t : void 0;
    const i = J(t);
    if (!o) {
      let u;
      if (i && (u = pu[s]))
        return u;
      if (s === "hasOwnProperty")
        return hu;
    }
    const a = Reflect.get(
      t,
      s,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ Pe(t) ? t : n
    );
    if ((pt(s) ? oi.has(s) : gu(s)) || (o || Ze(t, "get", s), l))
      return a;
    if (/* @__PURE__ */ Pe(a)) {
      const u = i && co(s) ? a : a.value;
      return o && xe(u) ? /* @__PURE__ */ er(u) : u;
    }
    return xe(a) ? o ? /* @__PURE__ */ er(a) : /* @__PURE__ */ Gt(a) : a;
  }
}
class li extends ri {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, s, n, o) {
    let l = t[s];
    const i = J(t) && co(s);
    if (!this._isShallow) {
      const h = /* @__PURE__ */ Jt(l);
      if (!/* @__PURE__ */ ft(n) && !/* @__PURE__ */ Jt(n) && (l = /* @__PURE__ */ be(l), n = /* @__PURE__ */ be(n)), !i && /* @__PURE__ */ Pe(l) && !/* @__PURE__ */ Pe(n))
        return h || (l.value = n), !0;
    }
    const a = i ? Number(s) < t.length : ve(t, s), u = Reflect.set(
      t,
      s,
      n,
      /* @__PURE__ */ Pe(t) ? t : o
    );
    return t === /* @__PURE__ */ be(o) && u && (a ? Ke(n, l) && Wt(t, "set", s, n) : Wt(t, "add", s, n)), u;
  }
  deleteProperty(t, s) {
    const n = ve(t, s);
    t[s];
    const o = Reflect.deleteProperty(t, s);
    return o && n && Wt(t, "delete", s, void 0), o;
  }
  has(t, s) {
    const n = Reflect.has(t, s);
    return (!pt(s) || !oi.has(s)) && Ze(t, "has", s), n;
  }
  ownKeys(t) {
    return Ze(
      t,
      "iterate",
      J(t) ? "length" : ps
    ), Reflect.ownKeys(t);
  }
}
class bu extends ri {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, s) {
    return !0;
  }
  deleteProperty(t, s) {
    return !0;
  }
}
const vu = /* @__PURE__ */ new li(), yu = /* @__PURE__ */ new bu(), xu = /* @__PURE__ */ new li(!0);
const Xo = (e) => e, Fn = (e) => Reflect.getPrototypeOf(e);
function _u(e, t, s) {
  return function(...n) {
    const o = this.__v_raw, l = /* @__PURE__ */ be(o), i = Is(l), a = e === "entries" || e === Symbol.iterator && i, u = e === "keys" && i, h = o[e](...n), g = s ? Xo : t ? $s : _t;
    return !t && Ze(
      l,
      "iterate",
      u ? Zo : ps
    ), Be(
      // inheriting all iterator properties
      Object.create(h),
      {
        // iterator protocol
        next() {
          const { value: x, done: A } = h.next();
          return A ? { value: x, done: A } : {
            value: a ? [g(x[0]), g(x[1])] : g(x),
            done: A
          };
        }
      }
    );
  };
}
function Hn(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function wu(e, t) {
  const s = {
    get(o) {
      const l = this.__v_raw, i = /* @__PURE__ */ be(l), a = /* @__PURE__ */ be(o);
      e || (Ke(o, a) && Ze(i, "get", o), Ze(i, "get", a));
      const { has: u } = Fn(i), h = t ? Xo : e ? $s : _t;
      if (u.call(i, o))
        return h(l.get(o));
      if (u.call(i, a))
        return h(l.get(a));
      l !== i && l.get(o);
    },
    get size() {
      const o = this.__v_raw;
      return !e && Ze(/* @__PURE__ */ be(o), "iterate", ps), o.size;
    },
    has(o) {
      const l = this.__v_raw, i = /* @__PURE__ */ be(l), a = /* @__PURE__ */ be(o);
      return e || (Ke(o, a) && Ze(i, "has", o), Ze(i, "has", a)), o === a ? l.has(o) : l.has(o) || l.has(a);
    },
    forEach(o, l) {
      const i = this, a = i.__v_raw, u = /* @__PURE__ */ be(a), h = t ? Xo : e ? $s : _t;
      return !e && Ze(u, "iterate", ps), a.forEach((g, x) => o.call(l, h(g), h(x), i));
    }
  };
  return Be(
    s,
    e ? {
      add: Hn("add"),
      set: Hn("set"),
      delete: Hn("delete"),
      clear: Hn("clear")
    } : {
      add(o) {
        const l = /* @__PURE__ */ be(this), i = Fn(l), a = /* @__PURE__ */ be(o), u = !t && !/* @__PURE__ */ ft(o) && !/* @__PURE__ */ Jt(o) ? a : o;
        return i.has.call(l, u) || Ke(o, u) && i.has.call(l, o) || Ke(a, u) && i.has.call(l, a) || (l.add(u), Wt(l, "add", u, u)), this;
      },
      set(o, l) {
        !t && !/* @__PURE__ */ ft(l) && !/* @__PURE__ */ Jt(l) && (l = /* @__PURE__ */ be(l));
        const i = /* @__PURE__ */ be(this), { has: a, get: u } = Fn(i);
        let h = a.call(i, o);
        h || (o = /* @__PURE__ */ be(o), h = a.call(i, o));
        const g = u.call(i, o);
        return i.set(o, l), h ? Ke(l, g) && Wt(i, "set", o, l) : Wt(i, "add", o, l), this;
      },
      delete(o) {
        const l = /* @__PURE__ */ be(this), { has: i, get: a } = Fn(l);
        let u = i.call(l, o);
        u || (o = /* @__PURE__ */ be(o), u = i.call(l, o)), a && a.call(l, o);
        const h = l.delete(o);
        return u && Wt(l, "delete", o, void 0), h;
      },
      clear() {
        const o = /* @__PURE__ */ be(this), l = o.size !== 0, i = o.clear();
        return l && Wt(
          o,
          "clear",
          void 0,
          void 0
        ), i;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((o) => {
    s[o] = _u(o, e, t);
  }), s;
}
function gr(e, t) {
  const s = wu(e, t);
  return (n, o, l) => o === "__v_isReactive" ? !e : o === "__v_isReadonly" ? e : o === "__v_raw" ? n : Reflect.get(
    ve(s, o) && o in n ? s : n,
    o,
    l
  );
}
const ku = {
  get: /* @__PURE__ */ gr(!1, !1)
}, Su = {
  get: /* @__PURE__ */ gr(!1, !0)
}, Cu = {
  get: /* @__PURE__ */ gr(!0, !1)
};
const ii = /* @__PURE__ */ new WeakMap(), ai = /* @__PURE__ */ new WeakMap(), ui = /* @__PURE__ */ new WeakMap(), Au = /* @__PURE__ */ new WeakMap();
function Eu(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
// @__NO_SIDE_EFFECTS__
function Gt(e) {
  return /* @__PURE__ */ Jt(e) ? e : hr(
    e,
    !1,
    vu,
    ku,
    ii
  );
}
// @__NO_SIDE_EFFECTS__
function Iu(e) {
  return hr(
    e,
    !1,
    xu,
    Su,
    ai
  );
}
// @__NO_SIDE_EFFECTS__
function er(e) {
  return hr(
    e,
    !0,
    yu,
    Cu,
    ui
  );
}
function hr(e, t, s, n, o) {
  if (!xe(e) || e.__v_raw && !(t && e.__v_isReactive) || e.__v_skip || !Object.isExtensible(e))
    return e;
  const l = o.get(e);
  if (l)
    return l;
  const i = Eu(Za(e));
  if (i === 0)
    return e;
  const a = new Proxy(
    e,
    i === 2 ? n : s
  );
  return o.set(e, a), a;
}
// @__NO_SIDE_EFFECTS__
function ms(e) {
  return /* @__PURE__ */ Jt(e) ? /* @__PURE__ */ ms(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function Jt(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function ft(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function bo(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function be(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ be(t) : e;
}
function Tu(e) {
  return !ve(e, "__v_skip") && Object.isExtensible(e) && ql(e, "__v_skip", !0), e;
}
const _t = (e) => xe(e) ? /* @__PURE__ */ Gt(e) : e, $s = (e) => xe(e) ? /* @__PURE__ */ er(e) : e;
// @__NO_SIDE_EFFECTS__
function Pe(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function N(e) {
  return Pu(e, !1);
}
function Pu(e, t) {
  return /* @__PURE__ */ Pe(e) ? e : new Ru(e, t);
}
class Ru {
  constructor(t, s) {
    this.dep = new go(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = s ? t : /* @__PURE__ */ be(t), this._value = s ? t : _t(t), this.__v_isShallow = s;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const s = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ ft(t) || /* @__PURE__ */ Jt(t);
    t = n ? t : /* @__PURE__ */ be(t), Ke(t, s) && (this._rawValue = t, this._value = n ? t : _t(t), this.dep.trigger());
  }
}
function Mu(e) {
  e.dep && e.dep.trigger();
}
function m(e) {
  return /* @__PURE__ */ Pe(e) ? e.value : e;
}
function di(e) {
  return X(e) ? e() : m(e);
}
const $u = {
  get: (e, t, s) => t === "__v_raw" ? e : m(Reflect.get(e, t, s)),
  set: (e, t, s, n) => {
    const o = e[t];
    return /* @__PURE__ */ Pe(o) && !/* @__PURE__ */ Pe(s) ? (o.value = s, !0) : Reflect.set(e, t, s, n);
  }
};
function ci(e) {
  return /* @__PURE__ */ ms(e) ? e : new Proxy(e, $u);
}
class Vu {
  constructor(t) {
    this.__v_isRef = !0, this._value = void 0;
    const s = this.dep = new go(), { get: n, set: o } = t(s.track.bind(s), s.trigger.bind(s));
    this._get = n, this._set = o;
  }
  get value() {
    return this._value = this._get();
  }
  set value(t) {
    this._set(t);
  }
}
function Ou(e) {
  return new Vu(e);
}
// @__NO_SIDE_EFFECTS__
function ju(e) {
  const t = J(e) ? new Array(e.length) : {};
  for (const s in e)
    t[s] = fi(e, s);
  return t;
}
class Nu {
  constructor(t, s, n) {
    this._object = t, this._defaultValue = n, this.__v_isRef = !0, this._value = void 0, this._key = pt(s) ? s : String(s), this._raw = /* @__PURE__ */ be(t);
    let o = !0, l = t;
    if (!J(t) || pt(this._key) || !co(this._key))
      do
        o = !/* @__PURE__ */ bo(l) || /* @__PURE__ */ ft(l);
      while (o && (l = l.__v_raw));
    this._shallow = o;
  }
  get value() {
    let t = this._object[this._key];
    return this._shallow && (t = m(t)), this._value = t === void 0 ? this._defaultValue : t;
  }
  set value(t) {
    if (this._shallow && /* @__PURE__ */ Pe(this._raw[this._key])) {
      const s = this._object[this._key];
      if (/* @__PURE__ */ Pe(s)) {
        s.value = t;
        return;
      }
    }
    this._object[this._key] = t;
  }
  get dep() {
    return fu(this._raw, this._key);
  }
}
class Lu {
  constructor(t) {
    this._getter = t, this.__v_isRef = !0, this.__v_isReadonly = !0, this._value = void 0;
  }
  get value() {
    return this._value = this._getter();
  }
}
// @__NO_SIDE_EFFECTS__
function Uu(e, t, s) {
  return /* @__PURE__ */ Pe(e) ? e : X(e) ? new Lu(e) : xe(e) && arguments.length > 1 ? fi(e, t, s) : /* @__PURE__ */ N(e);
}
function fi(e, t, s) {
  return new Nu(e, t, s);
}
class Du {
  constructor(t, s, n) {
    this.fn = t, this.setter = s, this._value = void 0, this.dep = new go(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = wn - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !s, this.isSSR = n;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    Se !== this)
      return Zl(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return ti(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function Bu(e, t, s = !1) {
  let n, o;
  return X(e) ? n = e : (n = e.get, o = e.set), new Du(n, o, s);
}
const zn = {}, Xn = /* @__PURE__ */ new WeakMap();
let fs;
function Fu(e, t = !1, s = fs) {
  if (s) {
    let n = Xn.get(s);
    n || Xn.set(s, n = []), n.push(e);
  }
}
function Hu(e, t, s = me) {
  const { immediate: n, deep: o, once: l, scheduler: i, augmentJob: a, call: u } = s, h = (U) => o ? U : /* @__PURE__ */ ft(U) || o === !1 || o === 0 ? qt(U, 1) : qt(U);
  let g, x, A, k, O = !1, v = !1;
  if (/* @__PURE__ */ Pe(e) ? (x = () => e.value, O = /* @__PURE__ */ ft(e)) : /* @__PURE__ */ ms(e) ? (x = () => h(e), O = !0) : J(e) ? (v = !0, O = e.some((U) => /* @__PURE__ */ ms(U) || /* @__PURE__ */ ft(U)), x = () => e.map((U) => {
    if (/* @__PURE__ */ Pe(U))
      return U.value;
    if (/* @__PURE__ */ ms(U))
      return h(U);
    if (X(U))
      return u ? u(U, 2) : U();
  })) : X(e) ? t ? x = u ? () => u(e, 2) : e : x = () => {
    if (A) {
      $t();
      try {
        A();
      } finally {
        Vt();
      }
    }
    const U = fs;
    fs = g;
    try {
      return u ? u(e, 3, [k]) : e(k);
    } finally {
      fs = U;
    }
  } : x = Mt, t && o) {
    const U = x, Z = o === !0 ? 1 / 0 : o;
    x = () => qt(U(), Z);
  }
  const F = uu(), z = () => {
    g.stop(), F && F.active && dr(F.effects, g);
  };
  if (l && t) {
    const U = t;
    t = (...Z) => {
      const Oe = U(...Z);
      return z(), Oe;
    };
  }
  let D = v ? new Array(e.length).fill(zn) : zn;
  const K = (U) => {
    if (!(!(g.flags & 1) || !g.dirty && !U))
      if (t) {
        const Z = g.run();
        if (U || o || O || (v ? Z.some((Oe, q) => Ke(Oe, D[q])) : Ke(Z, D))) {
          A && A();
          const Oe = fs;
          fs = g;
          try {
            const q = [
              Z,
              // pass undefined as the old value when it's changed for the first time
              D === zn ? void 0 : v && D[0] === zn ? [] : D,
              k
            ];
            D = Z, u ? u(t, 3, q) : (
              // @ts-expect-error
              t(...q)
            );
          } finally {
            fs = Oe;
          }
        }
      } else
        g.run();
  };
  return a && a(K), g = new Yl(x), g.scheduler = i ? () => i(K, !1) : K, k = (U) => Fu(U, !1, g), A = g.onStop = () => {
    const U = Xn.get(g);
    if (U) {
      if (u)
        u(U, 4);
      else
        for (const Z of U) Z();
      Xn.delete(g);
    }
  }, t ? n ? K(!0) : D = g.run() : i ? i(K.bind(null, !0), !0) : g.run(), z.pause = g.pause.bind(g), z.resume = g.resume.bind(g), z.stop = z, z;
}
function qt(e, t = 1 / 0, s) {
  if (t <= 0 || !xe(e) || e.__v_skip || (s = s || /* @__PURE__ */ new Map(), (s.get(e) || 0) >= t))
    return e;
  if (s.set(e, t), t--, /* @__PURE__ */ Pe(e))
    qt(e.value, t, s);
  else if (J(e))
    for (let n = 0; n < e.length; n++)
      qt(e[n], t, s);
  else if (js(e) || Is(e))
    e.forEach((n) => {
      qt(n, t, s);
    });
  else if (uo(e)) {
    for (const n in e)
      qt(e[n], t, s);
    for (const n of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, n) && qt(e[n], t, s);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.39
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function In(e, t, s, n) {
  try {
    return n ? e(...n) : e();
  } catch (o) {
    Tn(o, t, s);
  }
}
function wt(e, t, s, n) {
  if (X(e)) {
    const o = In(e, t, s, n);
    return o && Hl(o) && o.catch((l) => {
      Tn(l, t, s);
    }), o;
  }
  if (J(e)) {
    const o = [];
    for (let l = 0; l < e.length; l++)
      o.push(wt(e[l], t, s, n));
    return o;
  }
}
function Tn(e, t, s, n = !0) {
  const o = t ? t.vnode : null, { errorHandler: l, throwUnhandledErrorInProduction: i } = t && t.appContext.config || me;
  if (t) {
    let a = t.parent;
    const u = t.proxy, h = `https://vuejs.org/error-reference/#runtime-${s}`;
    for (; a; ) {
      const g = a.ec;
      if (g) {
        for (let x = 0; x < g.length; x++)
          if (g[x](e, u, h) === !1)
            return;
      }
      a = a.parent;
    }
    if (l) {
      $t(), In(l, null, 10, [
        e,
        u,
        h
      ]), Vt();
      return;
    }
  }
  zu(e, s, o, n, i);
}
function zu(e, t, s, n = !0, o = !1) {
  if (o)
    throw e;
  console.error(e);
}
const rt = [];
let Tt = -1;
const Ts = [];
let es = null, As = 0;
const pi = /* @__PURE__ */ Promise.resolve();
let eo = null;
function Pn(e) {
  const t = eo || pi;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function Wu(e) {
  let t = Tt + 1, s = rt.length;
  for (; t < s; ) {
    const n = t + s >>> 1, o = rt[n], l = Sn(o);
    l < e || l === e && o.flags & 2 ? t = n + 1 : s = n;
  }
  return t;
}
function br(e) {
  if (!(e.flags & 1)) {
    const t = Sn(e), s = rt[rt.length - 1];
    !s || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= Sn(s) ? rt.push(e) : rt.splice(Wu(t), 0, e), e.flags |= 1, mi();
  }
}
function mi() {
  eo || (eo = pi.then(hi));
}
function qu(e) {
  J(e) ? Ts.push(...e) : es && e.id === -1 ? es.splice(As + 1, 0, e) : e.flags & 1 || (Ts.push(e), e.flags |= 1), mi();
}
function nl(e, t, s = Tt + 1) {
  for (; s < rt.length; s++) {
    const n = rt[s];
    if (n && n.flags & 2) {
      if (e && n.id !== e.uid)
        continue;
      rt.splice(s, 1), s--, n.flags & 4 && (n.flags &= -2), n(), n.flags & 4 || (n.flags &= -2);
    }
  }
}
function gi(e) {
  if (Ts.length) {
    const t = [...new Set(Ts)].sort(
      (s, n) => Sn(s) - Sn(n)
    );
    if (Ts.length = 0, es) {
      es.push(...t);
      return;
    }
    for (es = t, As = 0; As < es.length; As++) {
      const s = es[As];
      s.flags & 4 && (s.flags &= -2), s.flags & 8 || s(), s.flags &= -2;
    }
    es = null, As = 0;
  }
}
const Sn = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function hi(e) {
  try {
    for (Tt = 0; Tt < rt.length; Tt++) {
      const t = rt[Tt];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), In(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; Tt < rt.length; Tt++) {
      const t = rt[Tt];
      t && (t.flags &= -2);
    }
    Tt = -1, rt.length = 0, gi(), eo = null, (rt.length || Ts.length) && hi();
  }
}
let et = null, bi = null;
function to(e) {
  const t = et;
  return et = e, bi = e && e.type.__scopeId || null, t;
}
function S(e, t = et, s) {
  if (!t || e._n)
    return e;
  const n = (...o) => {
    n._d && oo(-1);
    const l = to(t);
    let i;
    try {
      i = e(...o);
    } finally {
      to(l), n._d && oo(1);
    }
    return i;
  };
  return n._n = !0, n._c = !0, n._d = !0, n;
}
function vr(e, t) {
  if (et === null)
    return e;
  const s = _o(et), n = e.dirs || (e.dirs = []);
  for (let o = 0; o < t.length; o++) {
    let [l, i, a, u = me] = t[o];
    l && (X(l) && (l = {
      mounted: l,
      updated: l
    }), l.deep && qt(i), n.push({
      dir: l,
      instance: s,
      value: i,
      oldValue: void 0,
      arg: a,
      modifiers: u
    }));
  }
  return e;
}
function us(e, t, s, n) {
  const o = e.dirs, l = t && t.dirs;
  for (let i = 0; i < o.length; i++) {
    const a = o[i];
    l && (a.oldValue = l[i].value);
    let u = a.dir[n];
    u && ($t(), wt(u, s, 8, [
      e.el,
      a,
      e,
      t
    ]), Vt());
  }
}
function vi(e, t) {
  if (Xe) {
    let s = Xe.provides;
    const n = Xe.parent && Xe.parent.provides;
    n === s && (s = Xe.provides = Object.create(n)), s[e] = t;
  }
}
function bn(e, t, s = !1) {
  const n = rs();
  if (n || Rs) {
    let o = Rs ? Rs._context.provides : n ? n.parent == null || n.ce ? n.vnode.appContext && n.vnode.appContext.provides : n.parent.provides : void 0;
    if (o && e in o)
      return o[e];
    if (arguments.length > 1)
      return s && X(t) ? t.call(n && n.proxy) : t;
  }
}
const Ku = /* @__PURE__ */ Symbol.for("v-scx"), Gu = () => bn(Ku);
function Ju(e, t) {
  return yr(
    e,
    null,
    { flush: "sync" }
  );
}
function bt(e, t, s) {
  return yr(e, t, s);
}
function yr(e, t, s = me) {
  const { immediate: n, deep: o, flush: l, once: i } = s, a = Be({}, s), u = t && n || !t && l !== "post";
  let h;
  if (Vs) {
    if (l === "sync") {
      const k = Gu();
      h = k.__watcherHandles || (k.__watcherHandles = []);
    } else if (!u) {
      const k = () => {
      };
      return k.stop = Mt, k.resume = Mt, k.pause = Mt, k;
    }
  }
  const g = Xe;
  a.call = (k, O, v) => wt(k, g, O, v);
  let x = !1;
  l === "post" ? a.scheduler = (k) => {
    at(k, g && g.suspense);
  } : l !== "sync" && (x = !0, a.scheduler = (k, O) => {
    O ? k() : br(k);
  }), a.augmentJob = (k) => {
    t && (k.flags |= 4), x && (k.flags |= 2, g && (k.id = g.uid, k.i = g));
  };
  const A = Hu(e, t, a);
  return Vs && (h ? h.push(A) : u && A()), A;
}
function Yu(e, t, s) {
  const n = this.proxy, o = Ve(e) ? e.includes(".") ? yi(n, e) : () => n[e] : e.bind(n, n);
  let l;
  X(t) ? l = t : (l = t.handler, s = t);
  const i = Rn(this), a = yr(o, l.bind(n), s);
  return i(), a;
}
function yi(e, t) {
  const s = t.split(".");
  return () => {
    let n = e;
    for (let o = 0; o < s.length && n; o++)
      n = n[s[o]];
    return n;
  };
}
const Qu = /* @__PURE__ */ Symbol("_vte"), Zu = (e) => e.__isTeleport, Do = /* @__PURE__ */ Symbol("_leaveCb");
function xr(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, xr(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function We(e, t) {
  return X(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    Be({ name: e.name }, t, { setup: e })
  ) : e;
}
function _r(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function ol(e, t) {
  let s;
  return !!((s = Object.getOwnPropertyDescriptor(e, t)) && !s.configurable);
}
const so = /* @__PURE__ */ new WeakMap();
function vn(e, t, s, n, o = !1) {
  if (J(e)) {
    e.forEach(
      (v, F) => vn(
        v,
        t && (J(t) ? t[F] : t),
        s,
        n,
        o
      )
    );
    return;
  }
  if (Ps(n) && !o) {
    n.shapeFlag & 512 && n.type.__asyncResolved && n.component.subTree.component && vn(e, t, s, n.component.subTree);
    return;
  }
  const l = n.shapeFlag & 4 ? _o(n.component) : n.el, i = o ? null : l, { i: a, r: u } = e, h = t && t.r, g = a.refs === me ? a.refs = {} : a.refs, x = a.setupState, A = /* @__PURE__ */ be(x), k = x === me ? Fl : (v) => ol(g, v) ? !1 : ve(A, v), O = (v, F) => !(F && ol(g, F));
  if (h != null && h !== u) {
    if (rl(t), Ve(h))
      g[h] = null, k(h) && (x[h] = null);
    else if (/* @__PURE__ */ Pe(h)) {
      const v = t;
      O(h, v.k) && (h.value = null), v.k && (g[v.k] = null);
    }
  }
  if (X(u)) {
    $t();
    try {
      In(u, a, 12, [i, g]);
    } finally {
      Vt();
    }
  } else {
    const v = Ve(u), F = /* @__PURE__ */ Pe(u);
    if (v || F) {
      const z = () => {
        if (e.f) {
          const D = v ? k(u) ? x[u] : g[u] : O() || !e.k ? u.value : g[e.k];
          if (o)
            J(D) && dr(D, l);
          else if (J(D))
            D.includes(l) || D.push(l);
          else if (v)
            g[u] = [l], k(u) && (x[u] = g[u]);
          else {
            const K = [l];
            O(u, e.k) && (u.value = K), e.k && (g[e.k] = K);
          }
        } else v ? (g[u] = i, k(u) && (x[u] = i)) : F && (O(u, e.k) && (u.value = i), e.k && (g[e.k] = i));
      };
      if (i) {
        const D = () => {
          z(), so.delete(e);
        };
        D.id = -1, so.set(e, D), at(D, s);
      } else
        rl(e), z();
    }
  }
}
function rl(e) {
  const t = so.get(e);
  t && (t.flags |= 8, so.delete(e));
}
const ll = (e) => e.nodeType === 8;
mo().requestIdleCallback;
mo().cancelIdleCallback;
function Xu(e, t) {
  if (ll(e) && e.data === "[") {
    let s = 1, n = e.nextSibling;
    for (; n; ) {
      if (n.nodeType === 1) {
        if (t(n) === !1)
          break;
      } else if (ll(n))
        if (n.data === "]") {
          if (--s === 0) break;
        } else n.data === "[" && s++;
      n = n.nextSibling;
    }
  } else
    t(e);
}
const Ps = (e) => !!e.type.__asyncLoader;
// @__NO_SIDE_EFFECTS__
function ed(e) {
  X(e) && (e = { loader: e });
  const {
    loader: t,
    loadingComponent: s,
    errorComponent: n,
    delay: o = 200,
    hydrate: l,
    timeout: i,
    // undefined = never times out
    suspensible: a = !0,
    onError: u
  } = e;
  let h = null, g, x = 0;
  const A = () => (x++, h = null, k()), k = () => {
    let O;
    return h || (O = h = t().catch((v) => {
      if (v = v instanceof Error ? v : new Error(String(v)), u)
        return new Promise((F, z) => {
          u(v, () => F(A()), () => z(v), x + 1);
        });
      throw v;
    }).then((v) => O !== h && h ? h : (v && (v.__esModule || v[Symbol.toStringTag] === "Module") && (v = v.default), g = v, v)));
  };
  return /* @__PURE__ */ We({
    name: "AsyncComponentWrapper",
    __asyncLoader: k,
    __asyncHydrate(O, v, F) {
      let z = !1;
      (v.bu || (v.bu = [])).push(() => z = !0);
      const D = () => {
        z || F();
      }, K = l ? () => {
        const U = l(
          D,
          (Z) => Xu(O, Z)
        );
        U && (v.bum || (v.bum = [])).push(U);
      } : D;
      g ? K() : k().then(() => !v.isUnmounted && K());
    },
    get __asyncResolved() {
      return g;
    },
    setup() {
      const O = Xe;
      if (_r(O), g)
        return () => Wn(g, O);
      const v = (Z) => {
        h = null, Tn(
          Z,
          O,
          13,
          !n
        );
      };
      if (a && O.suspense || Vs)
        return k().then((Z) => () => Wn(Z, O)).catch((Z) => (v(Z), () => n ? y(n, {
          error: Z
        }) : null));
      const F = /* @__PURE__ */ N(!1), z = /* @__PURE__ */ N(), D = /* @__PURE__ */ N(!!o);
      let K, U;
      return kr(() => {
        K != null && clearTimeout(K), U != null && clearTimeout(U);
      }), o && (U = setTimeout(() => {
        O.isUnmounted || (D.value = !1);
      }, o)), i != null && (K = setTimeout(() => {
        if (!O.isUnmounted && !F.value && !z.value) {
          const Z = new Error(
            `Async component timed out after ${i}ms.`
          );
          v(Z), z.value = Z;
        }
      }, i)), k().then(() => {
        O.isUnmounted || (F.value = !0, O.parent && wr(O.parent.vnode) && O.parent.update());
      }).catch((Z) => {
        if (O.isUnmounted) {
          h = null;
          return;
        }
        v(Z), z.value = Z;
      }), () => {
        if (F.value && g)
          return Wn(g, O);
        if (z.value && n)
          return y(n, {
            error: z.value
          });
        if (s && !D.value)
          return Wn(
            s,
            O
          );
      };
    }
  });
}
function Wn(e, t) {
  const { ref: s, props: n, children: o, ce: l } = t.vnode, i = y(e, n, o);
  return i.ref = s, i.ce = l, delete t.vnode.ce, i;
}
const wr = (e) => e.type.__isKeepAlive;
function td(e, t) {
  xi(e, "a", t);
}
function sd(e, t) {
  xi(e, "da", t);
}
function xi(e, t, s = Xe) {
  const n = e.__wdc || (e.__wdc = () => {
    let o = s;
    for (; o; ) {
      if (o.isDeactivated)
        return;
      o = o.parent;
    }
    return e();
  });
  if (vo(t, n, s), s) {
    let o = s.parent;
    for (; o && o.parent; )
      wr(o.parent.vnode) && nd(n, t, s, o), o = o.parent;
  }
}
function nd(e, t, s, n) {
  const o = vo(
    t,
    e,
    n,
    !0
    /* prepend */
  );
  kr(() => {
    dr(n[t], o);
  }, s);
}
function vo(e, t, s = Xe, n = !1) {
  if (s) {
    const o = s[e] || (s[e] = []), l = t.__weh || (t.__weh = (...i) => {
      $t();
      const a = Rn(s), u = wt(t, s, e, i);
      return a(), Vt(), u;
    });
    return n ? o.unshift(l) : o.push(l), l;
  }
}
const Yt = (e) => (t, s = Xe) => {
  (!Vs || e === "sp") && vo(e, (...n) => t(...n), s);
}, od = Yt("bm"), _i = Yt("m"), rd = Yt(
  "bu"
), wi = Yt("u"), ki = Yt(
  "bum"
), kr = Yt("um"), ld = Yt(
  "sp"
), id = Yt("rtg"), ad = Yt("rtc");
function ud(e, t = Xe) {
  vo("ec", e, t);
}
const dd = /* @__PURE__ */ Symbol.for("v-ndc");
function Qe(e, t, s, n) {
  let o;
  const l = s, i = J(e);
  if (i || Ve(e)) {
    const a = i && /* @__PURE__ */ ms(e);
    let u = !1, h = !1;
    a && (u = !/* @__PURE__ */ ft(e), h = /* @__PURE__ */ Jt(e), e = ho(e)), o = new Array(e.length);
    for (let g = 0, x = e.length; g < x; g++)
      o[g] = t(
        u ? h ? $s(_t(e[g])) : _t(e[g]) : e[g],
        g,
        void 0,
        l
      );
  } else if (typeof e == "number") {
    o = new Array(e);
    for (let a = 0; a < e; a++)
      o[a] = t(a + 1, a, void 0, l);
  } else if (xe(e))
    if (e[Symbol.iterator])
      o = Array.from(
        e,
        (a, u) => t(a, u, void 0, l)
      );
    else {
      const a = Object.keys(e);
      o = new Array(a.length);
      for (let u = 0, h = a.length; u < h; u++) {
        const g = a[u];
        o[u] = t(e[g], g, u, l);
      }
    }
  else
    o = [];
  return o;
}
function os(e, t, s = {}, n, o) {
  if (et.ce || et.parent && Ps(et.parent) && et.parent.ce) {
    const h = Object.keys(s).length > 0;
    return C(), Ie(
      ue,
      null,
      [y("slot", s, n)],
      h ? -2 : 64
    );
  }
  let l = e[t];
  l && l._c && (l._d = !1), C();
  const i = l && Si(l(s)), a = s.key || // slot content array of a dynamic conditional slot may have a branch
  // key attached in the `createSlots` helper, respect that
  i && i.key, u = Ie(
    ue,
    {
      key: (a && !pt(a) ? a : `_${t}`) + // #7256 force differentiate fallback content from actual content
      (!i && n ? "_fb" : "")
    },
    i || [],
    i && e._ === 1 ? 64 : -2
  );
  return u.scopeId && (u.slotScopeIds = [u.scopeId + "-s"]), l && l._c && (l._d = !0), u;
}
function Si(e) {
  return e.some((t) => An(t) ? !(t.type === Ot || t.type === ue && !Si(t.children)) : !0) ? e : null;
}
const tr = (e) => e ? Wi(e) ? _o(e) : tr(e.parent) : null, yn = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ Be(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => tr(e.parent),
    $root: (e) => tr(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Ai(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      br(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = Pn.bind(e.proxy)),
    $watch: (e) => Yu.bind(e)
  })
), Bo = (e, t) => e !== me && !e.__isScriptSetup && ve(e, t), cd = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: s, setupState: n, data: o, props: l, accessCache: i, type: a, appContext: u } = e;
    if (t[0] !== "$") {
      const A = i[t];
      if (A !== void 0)
        switch (A) {
          case 1:
            return n[t];
          case 2:
            return o[t];
          case 4:
            return s[t];
          case 3:
            return l[t];
        }
      else {
        if (Bo(n, t))
          return i[t] = 1, n[t];
        if (o !== me && ve(o, t))
          return i[t] = 2, o[t];
        if (ve(l, t))
          return i[t] = 3, l[t];
        if (s !== me && ve(s, t))
          return i[t] = 4, s[t];
        sr && (i[t] = 0);
      }
    }
    const h = yn[t];
    let g, x;
    if (h)
      return t === "$attrs" && Ze(e.attrs, "get", ""), h(e);
    if (
      // css module (injected by vue-loader)
      (g = a.__cssModules) && (g = g[t])
    )
      return g;
    if (s !== me && ve(s, t))
      return i[t] = 4, s[t];
    if (
      // global properties
      x = u.config.globalProperties, ve(x, t)
    )
      return x[t];
  },
  set({ _: e }, t, s) {
    const { data: n, setupState: o, ctx: l } = e;
    return Bo(o, t) ? (o[t] = s, !0) : n !== me && ve(n, t) ? (n[t] = s, !0) : ve(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (l[t] = s, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: s, ctx: n, appContext: o, props: l, type: i }
  }, a) {
    let u;
    return !!(s[a] || e !== me && a[0] !== "$" && ve(e, a) || Bo(t, a) || ve(l, a) || ve(n, a) || ve(yn, a) || ve(o.config.globalProperties, a) || (u = i.__cssModules) && u[a]);
  },
  defineProperty(e, t, s) {
    return s.get != null ? e._.accessCache[t] = 0 : ve(s, "value") && this.set(e, t, s.value, null), Reflect.defineProperty(e, t, s);
  }
};
function il(e) {
  return J(e) ? e.reduce(
    (t, s) => (t[s] = null, t),
    {}
  ) : e;
}
let sr = !0;
function fd(e) {
  const t = Ai(e), s = e.proxy, n = e.ctx;
  sr = !1, t.beforeCreate && al(t.beforeCreate, e, "bc");
  const {
    // state
    data: o,
    computed: l,
    methods: i,
    watch: a,
    provide: u,
    inject: h,
    // lifecycle
    created: g,
    beforeMount: x,
    mounted: A,
    beforeUpdate: k,
    updated: O,
    activated: v,
    deactivated: F,
    beforeDestroy: z,
    beforeUnmount: D,
    destroyed: K,
    unmounted: U,
    render: Z,
    renderTracked: Oe,
    renderTriggered: q,
    errorCaptured: te,
    serverPrefetch: je,
    // public API
    expose: ke,
    inheritAttrs: Re,
    // assets
    components: ae,
    directives: ge,
    filters: Je
  } = t;
  if (h && pd(h, n, null), i)
    for (const de in i) {
      const ne = i[de];
      X(ne) && (n[de] = ne.bind(s));
    }
  if (o) {
    const de = o.call(s, s);
    xe(de) && (e.data = /* @__PURE__ */ Gt(de));
  }
  if (sr = !0, l)
    for (const de in l) {
      const ne = l[de], Ae = X(ne) ? ne.bind(s, s) : X(ne.get) ? ne.get.bind(s, s) : Mt, Me = !X(ne) && X(ne.set) ? ne.set.bind(s) : Mt, Le = ye({
        get: Ae,
        set: Me
      });
      Object.defineProperty(n, de, {
        enumerable: !0,
        configurable: !0,
        get: () => Le.value,
        set: (tt) => Le.value = tt
      });
    }
  if (a)
    for (const de in a)
      Ci(a[de], n, s, de);
  if (u) {
    const de = X(u) ? u.call(s) : u;
    Reflect.ownKeys(de).forEach((ne) => {
      vi(ne, de[ne]);
    });
  }
  g && al(g, e, "c");
  function Ce(de, ne) {
    J(ne) ? ne.forEach((Ae) => de(Ae.bind(s))) : ne && de(ne.bind(s));
  }
  if (Ce(od, x), Ce(_i, A), Ce(rd, k), Ce(wi, O), Ce(td, v), Ce(sd, F), Ce(ud, te), Ce(ad, Oe), Ce(id, q), Ce(ki, D), Ce(kr, U), Ce(ld, je), J(ke))
    if (ke.length) {
      const de = e.exposed || (e.exposed = {});
      ke.forEach((ne) => {
        Object.defineProperty(de, ne, {
          get: () => s[ne],
          set: (Ae) => s[ne] = Ae,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  Z && e.render === Mt && (e.render = Z), Re != null && (e.inheritAttrs = Re), ae && (e.components = ae), ge && (e.directives = ge), je && _r(e);
}
function pd(e, t, s = Mt) {
  J(e) && (e = nr(e));
  for (const n in e) {
    const o = e[n];
    let l;
    xe(o) ? "default" in o ? l = bn(
      o.from || n,
      o.default,
      !0
    ) : l = bn(o.from || n) : l = bn(o), /* @__PURE__ */ Pe(l) ? Object.defineProperty(t, n, {
      enumerable: !0,
      configurable: !0,
      get: () => l.value,
      set: (i) => l.value = i
    }) : t[n] = l;
  }
}
function al(e, t, s) {
  wt(
    J(e) ? e.map((n) => n.bind(t.proxy)) : e.bind(t.proxy),
    t,
    s
  );
}
function Ci(e, t, s, n) {
  let o = n.includes(".") ? yi(s, n) : () => s[n];
  if (Ve(e)) {
    const l = t[e];
    X(l) && bt(o, l);
  } else if (X(e))
    bt(o, e.bind(s));
  else if (xe(e))
    if (J(e))
      e.forEach((l) => Ci(l, t, s, n));
    else {
      const l = X(e.handler) ? e.handler.bind(s) : t[e.handler];
      X(l) && bt(o, l, e);
    }
}
function Ai(e) {
  const t = e.type, { mixins: s, extends: n } = t, {
    mixins: o,
    optionsCache: l,
    config: { optionMergeStrategies: i }
  } = e.appContext, a = l.get(t);
  let u;
  return a ? u = a : !o.length && !s && !n ? u = t : (u = {}, o.length && o.forEach(
    (h) => no(u, h, i, !0)
  ), no(u, t, i)), xe(t) && l.set(t, u), u;
}
function no(e, t, s, n = !1) {
  const { mixins: o, extends: l } = t;
  l && no(e, l, s, !0), o && o.forEach(
    (i) => no(e, i, s, !0)
  );
  for (const i in t)
    if (!(n && i === "expose")) {
      const a = md[i] || s && s[i];
      e[i] = a ? a(e[i], t[i]) : t[i];
    }
  return e;
}
const md = {
  data: ul,
  props: dl,
  emits: dl,
  // objects
  methods: dn,
  computed: dn,
  // lifecycle
  beforeCreate: nt,
  created: nt,
  beforeMount: nt,
  mounted: nt,
  beforeUpdate: nt,
  updated: nt,
  beforeDestroy: nt,
  beforeUnmount: nt,
  destroyed: nt,
  unmounted: nt,
  activated: nt,
  deactivated: nt,
  errorCaptured: nt,
  serverPrefetch: nt,
  // assets
  components: dn,
  directives: dn,
  // watch
  watch: hd,
  // provide / inject
  provide: ul,
  inject: gd
};
function ul(e, t) {
  return t ? e ? function() {
    return Be(
      X(e) ? e.call(this, this) : e,
      X(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function gd(e, t) {
  return dn(nr(e), nr(t));
}
function nr(e) {
  if (J(e)) {
    const t = {};
    for (let s = 0; s < e.length; s++)
      t[e[s]] = e[s];
    return t;
  }
  return e;
}
function nt(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function dn(e, t) {
  return e ? Be(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function dl(e, t) {
  return e ? J(e) && J(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : Be(
    /* @__PURE__ */ Object.create(null),
    il(e),
    il(t ?? {})
  ) : t;
}
function hd(e, t) {
  if (!e) return t;
  if (!t) return e;
  const s = Be(/* @__PURE__ */ Object.create(null), e);
  for (const n in t)
    s[n] = nt(e[n], t[n]);
  return s;
}
function Ei() {
  return {
    app: null,
    config: {
      isNativeTag: Fl,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let bd = 0;
function vd(e, t) {
  return function(n, o = null) {
    X(n) || (n = Be({}, n)), o != null && !xe(o) && (o = null);
    const l = Ei(), i = /* @__PURE__ */ new WeakSet(), a = [];
    let u = !1;
    const h = l.app = {
      _uid: bd++,
      _component: n,
      _props: o,
      _container: null,
      _context: l,
      _instance: null,
      version: Jd,
      get config() {
        return l.config;
      },
      set config(g) {
      },
      use(g, ...x) {
        return i.has(g) || (g && X(g.install) ? (i.add(g), g.install(h, ...x)) : X(g) && (i.add(g), g(h, ...x))), h;
      },
      mixin(g) {
        return l.mixins.includes(g) || l.mixins.push(g), h;
      },
      component(g, x) {
        return x ? (l.components[g] = x, h) : l.components[g];
      },
      directive(g, x) {
        return x ? (l.directives[g] = x, h) : l.directives[g];
      },
      mount(g, x, A) {
        if (!u) {
          const k = h._ceVNode || y(n, o);
          return k.appContext = l, A === !0 ? A = "svg" : A === !1 && (A = void 0), e(k, g, A), u = !0, h._container = g, g.__vue_app__ = h, _o(k.component);
        }
      },
      onUnmount(g) {
        a.push(g);
      },
      unmount() {
        u && (wt(
          a,
          h._instance,
          16
        ), e(null, h._container), delete h._container.__vue_app__);
      },
      provide(g, x) {
        return l.provides[g] = x, h;
      },
      runWithContext(g) {
        const x = Rs;
        Rs = h;
        try {
          return g();
        } finally {
          Rs = x;
        }
      }
    };
    return h;
  };
}
let Rs = null;
function yd(e, t, s = me) {
  const n = rs(), o = Ge(t), l = ut(t), i = Ii(e, o), a = Ou((u, h) => {
    let g, x = me, A;
    return Ju(() => {
      const k = e[o];
      Ke(g, k) && (g = k, h());
    }), {
      get() {
        return u(), s.get ? s.get(g) : g;
      },
      set(k) {
        const O = s.set ? s.set(k) : k;
        if (!Ke(O, g) && !(x !== me && Ke(k, x)))
          return;
        const v = n.vnode.props, F = !!(v && // check if parent has passed v-model
        (t in v || o in v || l in v) && (`onUpdate:${t}` in v || `onUpdate:${o}` in v || `onUpdate:${l}` in v));
        F || (g = k, h()), n.emit(`update:${t}`, O), Ke(k, x) && (Ke(k, O) && !Ke(O, A) || // #13524: browsers differ in when they flush microtasks between
        // event listeners. If a v-model listener emits an intermediate value
        // and a following listener restores the model to its previous prop
        // value before parent updates are flushed, the parent render can be
        // deduped as having no prop change. Force a local update so DOM state
        // such as an input's value is synchronized back to the current model.
        F && x !== me && !Ke(O, g)) && h(), x = k, A = O;
      }
    };
  });
  return a[Symbol.iterator] = () => {
    let u = 0;
    return {
      next() {
        return u < 2 ? { value: u++ ? i || me : a, done: !1 } : { done: !0 };
      }
    };
  }, a;
}
const Ii = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Ge(t)}Modifiers`] || e[`${ut(t)}Modifiers`];
function xd(e, t, ...s) {
  if (e.isUnmounted) return;
  const n = e.vnode.props || me;
  let o = s;
  const l = t.startsWith("update:"), i = l && Ii(n, t.slice(7));
  i && (i.trim && (o = s.map((g) => Ve(g) ? g.trim() : g)), i.number && (o = s.map(po)));
  let a, u = n[a = Gn(t)] || // also try camelCase event handler (#2249)
  n[a = Gn(Ge(t))];
  !u && l && (u = n[a = Gn(ut(t))]), u && wt(
    u,
    e,
    6,
    o
  );
  const h = n[a + "Once"];
  if (h) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[a])
      return;
    e.emitted[a] = !0, wt(
      h,
      e,
      6,
      o
    );
  }
}
const _d = /* @__PURE__ */ new WeakMap();
function Ti(e, t, s = !1) {
  const n = s ? _d : t.emitsCache, o = n.get(e);
  if (o !== void 0)
    return o;
  const l = e.emits;
  let i = {}, a = !1;
  if (!X(e)) {
    const u = (h) => {
      const g = Ti(h, t, !0);
      g && (a = !0, Be(i, g));
    };
    !s && t.mixins.length && t.mixins.forEach(u), e.extends && u(e.extends), e.mixins && e.mixins.forEach(u);
  }
  return !l && !a ? (xe(e) && n.set(e, null), null) : (J(l) ? l.forEach((u) => i[u] = null) : Be(i, l), xe(e) && n.set(e, i), i);
}
function yo(e, t) {
  return !e || !io(t) ? !1 : (t = t.slice(2), t = t === "Once" ? t : t.replace(/Once$/, ""), ve(e, t[0].toLowerCase() + t.slice(1)) || ve(e, ut(t)) || ve(e, t));
}
function cl(e) {
  const {
    type: t,
    vnode: s,
    proxy: n,
    withProxy: o,
    propsOptions: [l],
    slots: i,
    attrs: a,
    emit: u,
    render: h,
    renderCache: g,
    props: x,
    data: A,
    setupState: k,
    ctx: O,
    inheritAttrs: v
  } = e, F = to(e);
  let z, D;
  try {
    if (s.shapeFlag & 4) {
      const U = o || n, Z = U;
      z = Rt(
        h.call(
          Z,
          U,
          g,
          x,
          k,
          A,
          O
        )
      ), D = a;
    } else {
      const U = t;
      z = Rt(
        U.length > 1 ? U(
          x,
          { attrs: a, slots: i, emit: u }
        ) : U(
          x,
          null
        )
      ), D = t.props ? a : wd(a);
    }
  } catch (U) {
    xn.length = 0, Tn(U, e, 1), z = y(Ot);
  }
  let K = z;
  if (D && v !== !1) {
    const U = Object.keys(D), { shapeFlag: Z } = K;
    U.length && Z & 7 && (l && U.some(ao) && (D = kd(
      D,
      l
    )), K = gs(K, D, !1, !0));
  }
  return s.dirs && (K = gs(K, null, !1, !0), K.dirs = K.dirs ? K.dirs.concat(s.dirs) : s.dirs), s.transition && xr(K, s.transition), z = K, to(F), z;
}
const wd = (e) => {
  let t;
  for (const s in e)
    (s === "class" || s === "style" || io(s)) && ((t || (t = {}))[s] = e[s]);
  return t;
}, kd = (e, t) => {
  const s = {};
  for (const n in e)
    (!ao(n) || !(n.slice(9) in t)) && (s[n] = e[n]);
  return s;
};
function Sd(e, t, s) {
  const { props: n, children: o, component: l } = e, { props: i, children: a, patchFlag: u } = t, h = l.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (s && u >= 0) {
    if (u & 1024)
      return !0;
    if (u & 16)
      return n ? fl(n, i, h) : !!i;
    if (u & 8) {
      const g = t.dynamicProps;
      for (let x = 0; x < g.length; x++) {
        const A = g[x];
        if (Pi(i, n, A) && !yo(h, A))
          return !0;
      }
    }
  } else
    return (o || a) && (!a || !a.$stable) ? !0 : n === i ? !1 : n ? i ? fl(n, i, h) : !0 : !!i;
  return !1;
}
function fl(e, t, s) {
  const n = Object.keys(t);
  if (n.length !== Object.keys(e).length)
    return !0;
  for (let o = 0; o < n.length; o++) {
    const l = n[o];
    if (Pi(t, e, l) && !yo(s, l))
      return !0;
  }
  return !1;
}
function Pi(e, t, s) {
  const n = e[s], o = t[s];
  return s === "style" && xe(n) && xe(o) ? !ts(n, o) : n !== o;
}
function Cd({ vnode: e, parent: t, suspense: s }, n) {
  for (; t; ) {
    const o = t.subTree;
    if (o.suspense && o.suspense.activeBranch === e && (o.suspense.vnode.el = o.el = n, e = o), o === e)
      (e = t.vnode).el = n, t = t.parent;
    else
      break;
  }
  s && s.activeBranch === e && (s.vnode.el = n);
}
const Ri = {}, Mi = () => Object.create(Ri), $i = (e) => Object.getPrototypeOf(e) === Ri;
function Ad(e, t, s, n = !1) {
  const o = {}, l = Mi();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Vi(e, t, o, l);
  for (const i in e.propsOptions[0])
    i in o || (o[i] = void 0);
  s ? e.props = n ? o : /* @__PURE__ */ Iu(o) : e.type.props ? e.props = o : e.props = l, e.attrs = l;
}
function Ed(e, t, s, n) {
  const {
    props: o,
    attrs: l,
    vnode: { patchFlag: i }
  } = e, a = /* @__PURE__ */ be(o), [u] = e.propsOptions;
  let h = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (n || i > 0) && !(i & 16)
  ) {
    if (i & 8) {
      const g = e.vnode.dynamicProps;
      for (let x = 0; x < g.length; x++) {
        let A = g[x];
        if (yo(e.emitsOptions, A))
          continue;
        const k = t[A];
        if (u)
          if (ve(l, A))
            k !== l[A] && (l[A] = k, h = !0);
          else {
            const O = Ge(A);
            o[O] = or(
              u,
              a,
              O,
              k,
              e,
              !1
            );
          }
        else
          k !== l[A] && (l[A] = k, h = !0);
      }
    }
  } else {
    Vi(e, t, o, l) && (h = !0);
    let g;
    for (const x in a)
      (!t || // for camelCase
      !ve(t, x) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((g = ut(x)) === x || !ve(t, g))) && (u ? s && // for camelCase
      (s[x] !== void 0 || // for kebab-case
      s[g] !== void 0) && (o[x] = or(
        u,
        a,
        x,
        void 0,
        e,
        !0
      )) : delete o[x]);
    if (l !== a)
      for (const x in l)
        (!t || !ve(t, x)) && (delete l[x], h = !0);
  }
  h && Wt(e.attrs, "set", "");
}
function Vi(e, t, s, n) {
  const [o, l] = e.propsOptions;
  let i = !1, a;
  if (t)
    for (let u in t) {
      if (mn(u))
        continue;
      const h = t[u];
      let g;
      o && ve(o, g = Ge(u)) ? !l || !l.includes(g) ? s[g] = h : (a || (a = {}))[g] = h : yo(e.emitsOptions, u) || (!(u in n) || h !== n[u]) && (n[u] = h, i = !0);
    }
  if (l) {
    const u = /* @__PURE__ */ be(s), h = a || me;
    for (let g = 0; g < l.length; g++) {
      const x = l[g];
      s[x] = or(
        o,
        u,
        x,
        h[x],
        e,
        !ve(h, x)
      );
    }
  }
  return i;
}
function or(e, t, s, n, o, l) {
  const i = e[s];
  if (i != null) {
    const a = ve(i, "default");
    if (a && n === void 0) {
      const u = i.default;
      if (i.type !== Function && !i.skipFactory && X(u)) {
        const { propsDefaults: h } = o;
        if (s in h)
          n = h[s];
        else {
          const g = Rn(o);
          n = h[s] = u.call(
            null,
            t
          ), g();
        }
      } else
        n = u;
      o.ce && o.ce._setProp(s, n);
    }
    i[
      0
      /* shouldCast */
    ] && (l && !a ? n = !1 : i[
      1
      /* shouldCastTrue */
    ] && (n === "" || n === ut(s)) && (n = !0));
  }
  return n;
}
const Id = /* @__PURE__ */ new WeakMap();
function Oi(e, t, s = !1) {
  const n = s ? Id : t.propsCache, o = n.get(e);
  if (o)
    return o;
  const l = e.props, i = {}, a = [];
  let u = !1;
  if (!X(e)) {
    const g = (x) => {
      u = !0;
      const [A, k] = Oi(x, t, !0);
      Be(i, A), k && a.push(...k);
    };
    !s && t.mixins.length && t.mixins.forEach(g), e.extends && g(e.extends), e.mixins && e.mixins.forEach(g);
  }
  if (!l && !u)
    return xe(e) && n.set(e, Es), Es;
  if (J(l))
    for (let g = 0; g < l.length; g++) {
      const x = Ge(l[g]);
      pl(x) && (i[x] = me);
    }
  else if (l)
    for (const g in l) {
      const x = Ge(g);
      if (pl(x)) {
        const A = l[g], k = i[x] = J(A) || X(A) ? { type: A } : Be({}, A), O = k.type;
        let v = !1, F = !0;
        if (J(O))
          for (let z = 0; z < O.length; ++z) {
            const D = O[z], K = X(D) && D.name;
            if (K === "Boolean") {
              v = !0;
              break;
            } else K === "String" && (F = !1);
          }
        else
          v = X(O) && O.name === "Boolean";
        k[
          0
          /* shouldCast */
        ] = v, k[
          1
          /* shouldCastTrue */
        ] = F, (v || ve(k, "default")) && a.push(x);
      }
    }
  const h = [i, a];
  return xe(e) && n.set(e, h), h;
}
function pl(e) {
  return e[0] !== "$" && !mn(e);
}
const Sr = (e) => e === "_" || e === "_ctx" || e === "$stable", Cr = (e) => J(e) ? e.map(Rt) : [Rt(e)], Td = (e, t, s) => {
  if (t._n)
    return t;
  const n = S((...o) => Cr(t(...o)), s);
  return n._c = !1, n;
}, ji = (e, t, s) => {
  const n = e._ctx;
  for (const o in e) {
    if (Sr(o)) continue;
    const l = e[o];
    if (X(l))
      t[o] = Td(o, l, n);
    else if (l != null) {
      const i = Cr(l);
      t[o] = () => i;
    }
  }
}, Ni = (e, t) => {
  const s = Cr(t);
  e.slots.default = () => s;
}, Li = (e, t, s) => {
  for (const n in t)
    (s || !Sr(n)) && (e[n] = t[n]);
}, Pd = (e, t, s) => {
  const n = e.slots = Mi();
  if (e.vnode.shapeFlag & 32) {
    const o = t._;
    o ? (Li(n, t, s), s && ql(n, "_", o, !0)) : ji(t, n);
  } else t && Ni(e, t);
}, Rd = (e, t, s) => {
  const { vnode: n, slots: o } = e;
  let l = !0, i = me;
  if (n.shapeFlag & 32) {
    const a = t._;
    a ? s && a === 1 ? l = !1 : Li(o, t, s) : (l = !t.$stable, ji(t, o)), i = t;
  } else t && (Ni(e, t), i = { default: 1 });
  if (l)
    for (const a in o)
      !Sr(a) && i[a] == null && delete o[a];
}, at = jd;
function Md(e) {
  return $d(e);
}
function $d(e, t) {
  const s = mo();
  s.__VUE__ = !0;
  const {
    insert: n,
    remove: o,
    patchProp: l,
    createElement: i,
    createText: a,
    createComment: u,
    setText: h,
    setElementText: g,
    parentNode: x,
    nextSibling: A,
    setScopeId: k = Mt,
    insertStaticContent: O
  } = e, v = (p, b, w, P = null, I = null, E = null, L = void 0, V = null, j = !!b.dynamicChildren) => {
    if (p === b)
      return;
    p && !rn(p, b) && (P = jt(p), tt(p, I, E, !0), p = null), b.patchFlag === -2 && (j = !1, b.dynamicChildren = null);
    const { type: T, ref: Y, shapeFlag: B } = b;
    switch (T) {
      case xo:
        F(p, b, w, P);
        break;
      case Ot:
        z(p, b, w, P);
        break;
      case Yn:
        p == null && D(b, w, P, L);
        break;
      case ue:
        ae(
          p,
          b,
          w,
          P,
          I,
          E,
          L,
          V,
          j
        );
        break;
      default:
        B & 1 ? Z(
          p,
          b,
          w,
          P,
          I,
          E,
          L,
          V,
          j
        ) : B & 6 ? ge(
          p,
          b,
          w,
          P,
          I,
          E,
          L,
          V,
          j
        ) : (B & 64 || B & 128) && T.process(
          p,
          b,
          w,
          P,
          I,
          E,
          L,
          V,
          j,
          Ue
        );
    }
    Y != null && I ? vn(Y, p && p.ref, E, b || p, !b) : Y == null && p && p.ref != null && vn(p.ref, null, E, p, !0);
  }, F = (p, b, w, P) => {
    if (p == null)
      n(
        b.el = a(b.children),
        w,
        P
      );
    else {
      const I = b.el = p.el;
      b.children !== p.children && h(I, b.children);
    }
  }, z = (p, b, w, P) => {
    p == null ? n(
      b.el = u(b.children || ""),
      w,
      P
    ) : b.el = p.el;
  }, D = (p, b, w, P) => {
    [p.el, p.anchor] = O(
      p.children,
      b,
      w,
      P,
      p.el,
      p.anchor
    );
  }, K = ({ el: p, anchor: b }, w, P) => {
    let I;
    for (; p && p !== b; )
      I = A(p), n(p, w, P), p = I;
    n(b, w, P);
  }, U = ({ el: p, anchor: b }) => {
    let w;
    for (; p && p !== b; )
      w = A(p), o(p), p = w;
    o(b);
  }, Z = (p, b, w, P, I, E, L, V, j) => {
    if (b.type === "svg" ? L = "svg" : b.type === "math" && (L = "mathml"), p == null)
      Oe(
        b,
        w,
        P,
        I,
        E,
        L,
        V,
        j
      );
    else {
      const T = p.el && p.el._isVueCE ? p.el : null;
      try {
        T && T._beginPatch(), je(
          p,
          b,
          I,
          E,
          L,
          V,
          j
        );
      } finally {
        T && T._endPatch();
      }
    }
  }, Oe = (p, b, w, P, I, E, L, V) => {
    let j, T;
    const { props: Y, shapeFlag: B, transition: G, dirs: Q } = p;
    if (j = p.el = i(
      p.type,
      E,
      Y && Y.is,
      Y
    ), B & 8 ? g(j, p.children) : B & 16 && te(
      p.children,
      j,
      null,
      P,
      I,
      Fo(p, E),
      L,
      V
    ), Q && us(p, null, P, "created"), q(j, p, p.scopeId, L, P), Y) {
      for (const _e in Y)
        _e !== "value" && !mn(_e) && l(j, _e, null, Y[_e], E, P);
      "value" in Y && l(j, "value", null, Y.value, E), (T = Y.onVnodeBeforeMount) && It(T, P, p);
    }
    Q && us(p, null, P, "beforeMount");
    const re = Vd(I, G);
    re && G.beforeEnter(j), n(j, b, w), ((T = Y && Y.onVnodeMounted) || re || Q) && at(() => {
      try {
        T && It(T, P, p), re && G.enter(j), Q && us(p, null, P, "mounted");
      } finally {
      }
    }, I);
  }, q = (p, b, w, P, I) => {
    if (w && k(p, w), P)
      for (let E = 0; E < P.length; E++)
        k(p, P[E]);
    if (I) {
      let E = I.subTree;
      if (b === E || Fi(E.type) && (E.ssContent === b || E.ssFallback === b)) {
        const L = I.vnode;
        q(
          p,
          L,
          L.scopeId,
          L.slotScopeIds,
          I.parent
        );
      }
    }
  }, te = (p, b, w, P, I, E, L, V, j = 0) => {
    for (let T = j; T < p.length; T++) {
      const Y = p[T] = V ? zt(p[T]) : Rt(p[T]);
      v(
        null,
        Y,
        b,
        w,
        P,
        I,
        E,
        L,
        V
      );
    }
  }, je = (p, b, w, P, I, E, L) => {
    const V = b.el = p.el;
    let { patchFlag: j, dynamicChildren: T, dirs: Y } = b;
    j |= p.patchFlag & 16;
    const B = p.props || me, G = b.props || me;
    let Q;
    if (w && ds(w, !1), (Q = G.onVnodeBeforeUpdate) && It(Q, w, b, p), Y && us(b, p, w, "beforeUpdate"), w && ds(w, !0), // #6385 the old vnode may be a user-wrapped non-isomorphic block
    // Force full diff when block metadata is unstable.
    T && (!p.dynamicChildren || p.dynamicChildren.length !== T.length) && (j = 0, L = !1, T = null), (B.innerHTML && G.innerHTML == null || B.textContent && G.textContent == null) && g(V, ""), T ? ke(
      p.dynamicChildren,
      T,
      V,
      w,
      P,
      Fo(b, I),
      E
    ) : L || ne(
      p,
      b,
      V,
      null,
      w,
      P,
      Fo(b, I),
      E,
      !1
    ), j > 0) {
      if (j & 16)
        Re(V, B, G, w, I);
      else if (j & 2 && B.class !== G.class && l(V, "class", null, G.class, I), j & 4 && l(V, "style", B.style, G.style, I), j & 8) {
        const re = b.dynamicProps;
        for (let _e = 0; _e < re.length; _e++) {
          const ie = re[_e], we = B[ie], $e = G[ie];
          ($e !== we || ie === "value") && l(V, ie, we, $e, I, w);
        }
      }
      j & 1 && p.children !== b.children && g(V, b.children);
    } else !L && T == null && Re(V, B, G, w, I);
    ((Q = G.onVnodeUpdated) || Y) && at(() => {
      Q && It(Q, w, b, p), Y && us(b, p, w, "updated");
    }, P);
  }, ke = (p, b, w, P, I, E, L) => {
    for (let V = 0; V < b.length; V++) {
      const j = p[V], T = b[V], Y = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        j.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (j.type === ue || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !rn(j, T) || // - In the case of a component, it could contain anything.
        j.shapeFlag & 198) ? x(j.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          w
        )
      );
      v(
        j,
        T,
        Y,
        null,
        P,
        I,
        E,
        L,
        !0
      );
    }
  }, Re = (p, b, w, P, I) => {
    if (b !== w) {
      if (b !== me)
        for (const E in b)
          !mn(E) && !(E in w) && l(
            p,
            E,
            b[E],
            null,
            I,
            P
          );
      for (const E in w) {
        if (mn(E)) continue;
        const L = w[E], V = b[E];
        L !== V && E !== "value" && l(p, E, V, L, I, P);
      }
      "value" in w && l(p, "value", b.value, w.value, I);
    }
  }, ae = (p, b, w, P, I, E, L, V, j) => {
    const T = b.el = p ? p.el : a(""), Y = b.anchor = p ? p.anchor : a("");
    let { patchFlag: B, dynamicChildren: G, slotScopeIds: Q } = b;
    Q && (V = V ? V.concat(Q) : Q), p == null ? (n(T, w, P), n(Y, w, P), te(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      b.children || [],
      w,
      Y,
      I,
      E,
      L,
      V,
      j
    )) : B > 0 && B & 64 && G && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    p.dynamicChildren && p.dynamicChildren.length === G.length ? (ke(
      p.dynamicChildren,
      G,
      w,
      I,
      E,
      L,
      V
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (b.key != null || I && b === I.subTree) && Ui(
      p,
      b,
      !0
      /* shallow */
    )) : ne(
      p,
      b,
      w,
      Y,
      I,
      E,
      L,
      V,
      j
    );
  }, ge = (p, b, w, P, I, E, L, V, j) => {
    b.slotScopeIds = V, p == null ? b.shapeFlag & 512 ? I.ctx.activate(
      b,
      w,
      P,
      L,
      j
    ) : Je(
      b,
      w,
      P,
      I,
      E,
      L,
      j
    ) : dt(p, b, j);
  }, Je = (p, b, w, P, I, E, L) => {
    const V = p.component = Hd(
      p,
      P,
      I
    );
    if (wr(p) && (V.ctx.renderer = Ue), zd(V, !1, L), V.asyncDep) {
      if (I && I.registerDep(V, Ce, L), !p.el) {
        const j = V.subTree = y(Ot);
        z(null, j, b, w), p.placeholder = j.el;
      }
    } else
      Ce(
        V,
        p,
        b,
        w,
        I,
        E,
        L
      );
  }, dt = (p, b, w) => {
    const P = b.component = p.component;
    if (Sd(p, b, w))
      if (P.asyncDep && !P.asyncResolved) {
        de(P, b, w);
        return;
      } else
        P.next = b, P.update();
    else
      b.el = p.el, P.vnode = b;
  }, Ce = (p, b, w, P, I, E, L) => {
    const V = () => {
      if (p.isMounted) {
        let { next: B, bu: G, u: Q, parent: re, vnode: _e } = p;
        {
          const st = Di(p);
          if (st) {
            B && (B.el = _e.el, de(p, B, L)), st.asyncDep.then(() => {
              at(() => {
                p.isUnmounted || T();
              }, I);
            });
            return;
          }
        }
        let ie = B, we;
        ds(p, !1), B ? (B.el = _e.el, de(p, B, L)) : B = _e, G && Jn(G), (we = B.props && B.props.onVnodeBeforeUpdate) && It(we, re, B, _e), ds(p, !0);
        const $e = cl(p), He = p.subTree;
        p.subTree = $e, v(
          He,
          $e,
          // parent may have changed if it's in a teleport
          x(He.el),
          // anchor may have changed if it's in a fragment
          jt(He),
          p,
          I,
          E
        ), B.el = $e.el, ie === null && Cd(p, $e.el), Q && at(Q, I), (we = B.props && B.props.onVnodeUpdated) && at(
          () => It(we, re, B, _e),
          I
        );
      } else {
        let B;
        const { el: G, props: Q } = b, { bm: re, m: _e, parent: ie, root: we, type: $e } = p, He = Ps(b);
        ds(p, !1), re && Jn(re), !He && (B = Q && Q.onVnodeBeforeMount) && It(B, ie, b), ds(p, !0);
        {
          we.ce && we.ce._hasShadowRoot() && we.ce._injectChildStyle(
            $e,
            p.parent ? p.parent.type : void 0
          );
          const st = p.subTree = cl(p);
          v(
            null,
            st,
            w,
            P,
            p,
            I,
            E
          ), b.el = st.el;
        }
        if (_e && at(_e, I), !He && (B = Q && Q.onVnodeMounted)) {
          const st = b;
          at(
            () => It(B, ie, st),
            I
          );
        }
        (b.shapeFlag & 256 || ie && Ps(ie.vnode) && ie.vnode.shapeFlag & 256) && p.a && at(p.a, I), p.isMounted = !0, b = w = P = null;
      }
    };
    p.scope.on();
    const j = p.effect = new Yl(V);
    p.scope.off();
    const T = p.update = j.run.bind(j), Y = p.job = j.runIfDirty.bind(j);
    Y.i = p, Y.id = p.uid, j.scheduler = () => br(Y), ds(p, !0), T();
  }, de = (p, b, w) => {
    b.component = p;
    const P = p.vnode.props;
    p.vnode = b, p.next = null, Ed(p, b.props, P, w), Rd(p, b.children, w), $t(), nl(p), Vt();
  }, ne = (p, b, w, P, I, E, L, V, j = !1) => {
    const T = p && p.children, Y = p ? p.shapeFlag : 0, B = b.children, { patchFlag: G, shapeFlag: Q } = b;
    if (G > 0) {
      if (G & 128) {
        Me(
          T,
          B,
          w,
          P,
          I,
          E,
          L,
          V,
          j
        );
        return;
      } else if (G & 256) {
        Ae(
          T,
          B,
          w,
          P,
          I,
          E,
          L,
          V,
          j
        );
        return;
      }
    }
    Q & 8 ? (Y & 16 && ls(T, I, E), B !== T && g(w, B)) : Y & 16 ? Q & 16 ? Me(
      T,
      B,
      w,
      P,
      I,
      E,
      L,
      V,
      j
    ) : ls(T, I, E, !0) : (Y & 8 && g(w, ""), Q & 16 && te(
      B,
      w,
      P,
      I,
      E,
      L,
      V,
      j
    ));
  }, Ae = (p, b, w, P, I, E, L, V, j) => {
    p = p || Es, b = b || Es;
    const T = p.length, Y = b.length, B = Math.min(T, Y);
    let G;
    for (G = 0; G < B; G++) {
      const Q = b[G] = j ? zt(b[G]) : Rt(b[G]);
      v(
        p[G],
        Q,
        w,
        null,
        I,
        E,
        L,
        V,
        j
      );
    }
    T > Y ? ls(
      p,
      I,
      E,
      !0,
      !1,
      B
    ) : te(
      b,
      w,
      P,
      I,
      E,
      L,
      V,
      j,
      B
    );
  }, Me = (p, b, w, P, I, E, L, V, j) => {
    let T = 0;
    const Y = b.length;
    let B = p.length - 1, G = Y - 1;
    for (; T <= B && T <= G; ) {
      const Q = p[T], re = b[T] = j ? zt(b[T]) : Rt(b[T]);
      if (rn(Q, re))
        v(
          Q,
          re,
          w,
          null,
          I,
          E,
          L,
          V,
          j
        );
      else
        break;
      T++;
    }
    for (; T <= B && T <= G; ) {
      const Q = p[B], re = b[G] = j ? zt(b[G]) : Rt(b[G]);
      if (rn(Q, re))
        v(
          Q,
          re,
          w,
          null,
          I,
          E,
          L,
          V,
          j
        );
      else
        break;
      B--, G--;
    }
    if (T > B) {
      if (T <= G) {
        const Q = G + 1, re = Q < Y ? b[Q].el : P;
        for (; T <= G; )
          v(
            null,
            b[T] = j ? zt(b[T]) : Rt(b[T]),
            w,
            re,
            I,
            E,
            L,
            V,
            j
          ), T++;
      }
    } else if (T > G)
      for (; T <= B; )
        tt(p[T], I, E, !0), T++;
    else {
      const Q = T, re = T, _e = /* @__PURE__ */ new Map();
      for (T = re; T <= G; T++) {
        const ze = b[T] = j ? zt(b[T]) : Rt(b[T]);
        ze.key != null && _e.set(ze.key, T);
      }
      let ie, we = 0;
      const $e = G - re + 1;
      let He = !1, st = 0;
      const yt = new Array($e);
      for (T = 0; T < $e; T++) yt[T] = 0;
      for (T = Q; T <= B; T++) {
        const ze = p[T];
        if (we >= $e) {
          tt(ze, I, E, !0);
          continue;
        }
        let gt;
        if (ze.key != null)
          gt = _e.get(ze.key);
        else
          for (ie = re; ie <= G; ie++)
            if (yt[ie - re] === 0 && rn(ze, b[ie])) {
              gt = ie;
              break;
            }
        gt === void 0 ? tt(ze, I, E, !0) : (yt[gt - re] = T + 1, gt >= st ? st = gt : He = !0, v(
          ze,
          b[gt],
          w,
          null,
          I,
          E,
          L,
          V,
          j
        ), we++);
      }
      const Us = He ? Od(yt) : Es;
      for (ie = Us.length - 1, T = $e - 1; T >= 0; T--) {
        const ze = re + T, gt = b[ze], Nt = b[ze + 1], kt = ze + 1 < Y ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Nt.el || Bi(Nt)
        ) : P;
        yt[T] === 0 ? v(
          null,
          gt,
          w,
          kt,
          I,
          E,
          L,
          V,
          j
        ) : He && (ie < 0 || T !== Us[ie] ? Le(gt, w, kt, 2) : ie--);
      }
    }
  }, Le = (p, b, w, P, I = null) => {
    const { el: E, type: L, transition: V, children: j, shapeFlag: T } = p;
    if (T & 6) {
      Le(p.component.subTree, b, w, P);
      return;
    }
    if (T & 128) {
      p.suspense.move(b, w, P);
      return;
    }
    if (T & 64) {
      L.move(p, b, w, Ue);
      return;
    }
    if (L === ue) {
      n(E, b, w);
      for (let B = 0; B < j.length; B++)
        Le(j[B], b, w, P);
      n(p.anchor, b, w);
      return;
    }
    if (L === Yn) {
      K(p, b, w);
      return;
    }
    if (P !== 2 && T & 1 && V)
      if (P === 0)
        V.persisted && !E[Do] ? n(E, b, w) : (V.beforeEnter(E), n(E, b, w), at(() => V.enter(E), I));
      else {
        const { leave: B, delayLeave: G, afterLeave: Q } = V, re = () => {
          p.ctx.isUnmounted ? o(E) : n(E, b, w);
        }, _e = () => {
          const ie = E._isLeaving || !!E[Do];
          E._isLeaving && E[Do](
            !0
            /* cancelled */
          ), V.persisted && !ie ? re() : B(E, () => {
            re(), Q && Q();
          });
        };
        G ? G(E, re, _e) : _e();
      }
    else
      n(E, b, w);
  }, tt = (p, b, w, P = !1, I = !1) => {
    const {
      type: E,
      props: L,
      ref: V,
      children: j,
      dynamicChildren: T,
      shapeFlag: Y,
      patchFlag: B,
      dirs: G,
      cacheIndex: Q,
      memo: re
    } = p;
    if (B === -2 && (I = !1), V != null && ($t(), vn(V, null, w, p, !0), Vt()), Q != null && (b.renderCache[Q] = void 0), Y & 256) {
      b.ctx.deactivate(p);
      return;
    }
    const _e = Y & 1 && G, ie = !Ps(p);
    let we;
    if (ie && (we = L && L.onVnodeBeforeUnmount) && It(we, b, p), Y & 6)
      Mn(p.component, w, P);
    else {
      if (Y & 128) {
        p.suspense.unmount(w, P);
        return;
      }
      _e && us(p, null, b, "beforeUnmount"), Y & 64 ? p.type.remove(
        p,
        b,
        w,
        Ue,
        P
      ) : T && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !T.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (E !== ue || B > 0 && B & 64) ? ls(
        T,
        b,
        w,
        !1,
        !0
      ) : (E === ue && B & 384 || !I && Y & 16) && ls(j, b, w), P && mt(p);
    }
    const $e = re != null && Q == null;
    (ie && (we = L && L.onVnodeUnmounted) || _e || $e) && at(() => {
      we && It(we, b, p), _e && us(p, null, b, "unmounted"), $e && (p.el = null);
    }, w);
  }, mt = (p) => {
    const { type: b, el: w, anchor: P, transition: I } = p;
    if (b === ue) {
      ko(w, P);
      return;
    }
    if (b === Yn) {
      U(p);
      return;
    }
    const E = () => {
      o(w), I && !I.persisted && I.afterLeave && I.afterLeave();
    };
    if (p.shapeFlag & 1 && I && !I.persisted) {
      const { leave: L, delayLeave: V } = I, j = () => L(w, E);
      V ? V(p.el, E, j) : j();
    } else
      E();
  }, ko = (p, b) => {
    let w;
    for (; p !== b; )
      w = A(p), o(p), p = w;
    o(b);
  }, Mn = (p, b, w) => {
    const { bum: P, scope: I, job: E, subTree: L, um: V, m: j, a: T } = p;
    ml(j), ml(T), P && Jn(P), I.stop(), E && (E.flags |= 8, tt(L, p, b, w)), V && at(V, b), at(() => {
      p.isUnmounted = !0;
    }, b);
  }, ls = (p, b, w, P = !1, I = !1, E = 0) => {
    for (let L = E; L < p.length; L++)
      tt(p[L], b, w, P, I);
  }, jt = (p) => {
    if (p.shapeFlag & 6)
      return jt(p.component.subTree);
    if (p.shapeFlag & 128)
      return p.suspense.next();
    const b = A(p.anchor || p.el), w = b && b[Qu];
    return w ? A(w) : b;
  };
  let Ls = !1;
  const $n = (p, b, w) => {
    let P;
    p == null ? b._vnode && (tt(b._vnode, null, null, !0), P = b._vnode.component) : v(
      b._vnode || null,
      p,
      b,
      null,
      null,
      null,
      w
    ), b._vnode = p, Ls || (Ls = !0, nl(P), gi(), Ls = !1);
  }, Ue = {
    p: v,
    um: tt,
    m: Le,
    r: mt,
    mt: Je,
    mc: te,
    pc: ne,
    pbc: ke,
    n: jt,
    o: e
  };
  return {
    render: $n,
    hydrate: void 0,
    createApp: vd($n)
  };
}
function Fo({ type: e, props: t }, s) {
  return s === "svg" && e === "foreignObject" || s === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : s;
}
function ds({ effect: e, job: t }, s) {
  s ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Vd(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Ui(e, t, s = !1) {
  const n = e.children, o = t.children;
  if (J(n) && J(o))
    for (let l = 0; l < n.length; l++) {
      const i = n[l];
      let a = o[l];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = o[l] = zt(o[l]), a.el = i.el), !s && a.patchFlag !== -2 && Ui(i, a)), a.type === xo && (a.patchFlag === -1 && (a = o[l] = zt(a)), a.el = i.el), a.type === Ot && !a.el && (a.el = i.el);
    }
}
function Od(e) {
  const t = e.slice(), s = [0];
  let n, o, l, i, a;
  const u = e.length;
  for (n = 0; n < u; n++) {
    const h = e[n];
    if (h !== 0) {
      if (o = s[s.length - 1], e[o] < h) {
        t[n] = o, s.push(n);
        continue;
      }
      for (l = 0, i = s.length - 1; l < i; )
        a = l + i >> 1, e[s[a]] < h ? l = a + 1 : i = a;
      h < e[s[l]] && (l > 0 && (t[n] = s[l - 1]), s[l] = n);
    }
  }
  for (l = s.length, i = s[l - 1]; l-- > 0; )
    s[l] = i, i = t[i];
  return s;
}
function Di(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : Di(t);
}
function ml(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function Bi(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? Bi(t.subTree) : null;
}
const Fi = (e) => e.__isSuspense;
function jd(e, t) {
  t && t.pendingBranch ? J(e) ? t.effects.push(...e) : t.effects.push(e) : qu(e);
}
const ue = /* @__PURE__ */ Symbol.for("v-fgt"), xo = /* @__PURE__ */ Symbol.for("v-txt"), Ot = /* @__PURE__ */ Symbol.for("v-cmt"), Yn = /* @__PURE__ */ Symbol.for("v-stc"), xn = [];
let ct = null;
function C(e = !1) {
  xn.push(ct = e ? null : []);
}
function Nd() {
  xn.pop(), ct = xn[xn.length - 1] || null;
}
let Cn = 1;
function oo(e, t = !1) {
  Cn += e, e < 0 && ct && t && (ct.hasOnce = !0);
}
function Hi(e) {
  return e.dynamicChildren = Cn > 0 ? ct || Es : null, Nd(), Cn > 0 && ct && ct.push(e), e;
}
function R(e, t, s, n, o, l) {
  return Hi(
    f(
      e,
      t,
      s,
      n,
      o,
      l,
      !0
    )
  );
}
function Ie(e, t, s, n, o) {
  return Hi(
    y(
      e,
      t,
      s,
      n,
      o,
      !0
    )
  );
}
function An(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function rn(e, t) {
  return e.type === t.type && e.key === t.key;
}
const zi = ({ key: e }) => e ?? null, Qn = ({
  ref: e,
  ref_key: t,
  ref_for: s
}) => (typeof e == "number" && (e = "" + e), e != null ? Ve(e) || /* @__PURE__ */ Pe(e) || X(e) ? { i: et, r: e, k: t, f: !!s } : e : null);
function f(e, t = null, s = null, n = 0, o = null, l = e === ue ? 0 : 1, i = !1, a = !1) {
  const u = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && zi(t),
    ref: t && Qn(t),
    scopeId: bi,
    slotScopeIds: null,
    children: s,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: l,
    patchFlag: n,
    dynamicProps: o,
    dynamicChildren: null,
    appContext: null,
    ctx: et
  };
  return a ? (ro(u, s), l & 128 && e.normalize(u)) : s && (u.shapeFlag |= Ve(s) ? 8 : 16), Cn > 0 && // avoid a block node from tracking itself
  !i && // has current parent block
  ct && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (u.patchFlag > 0 || l & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  u.patchFlag !== 32 && ct.push(u), u;
}
const y = Ld;
function Ld(e, t = null, s = null, n = 0, o = null, l = !1) {
  if ((!e || e === dd) && (e = Ot), An(e)) {
    const a = gs(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return s && ro(a, s), Cn > 0 && !l && ct && (a.shapeFlag & 6 ? ct[ct.indexOf(e)] = a : ct.push(a)), a.patchFlag = -2, a;
  }
  if (Gd(e) && (e = e.__vccOpts), t) {
    t = Ud(t);
    let { class: a, style: u } = t;
    a && !Ve(a) && (t.class = ot(a)), xe(u) && (/* @__PURE__ */ bo(u) && !J(u) && (u = Be({}, u)), t.style = _n(u));
  }
  const i = Ve(e) ? 1 : Fi(e) ? 128 : Zu(e) ? 64 : xe(e) ? 4 : X(e) ? 2 : 0;
  return f(
    e,
    t,
    s,
    n,
    o,
    i,
    l,
    !0
  );
}
function Ud(e) {
  return e ? /* @__PURE__ */ bo(e) || $i(e) ? Be({}, e) : e : null;
}
function gs(e, t, s = !1, n = !1) {
  const { props: o, ref: l, patchFlag: i, children: a, transition: u } = e, h = t ? ss(o || {}, t) : o, g = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: h,
    key: h && zi(h),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      s && l ? J(l) ? l.concat(Qn(t)) : [l, Qn(t)] : Qn(t)
    ) : l,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: a,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== ue ? i === -1 ? 16 : i | 16 : i,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: u,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && gs(e.ssContent),
    ssFallback: e.ssFallback && gs(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return u && n && xr(
    g,
    u.clone(g)
  ), g;
}
function _(e = " ", t = 0) {
  return y(xo, null, e, t);
}
function Dd(e, t) {
  const s = y(Yn, null, e);
  return s.staticCount = t, s;
}
function W(e = "", t = !1) {
  return t ? (C(), Ie(Ot, null, e)) : y(Ot, null, e);
}
function Rt(e) {
  return e == null || typeof e == "boolean" ? y(Ot) : J(e) ? y(
    ue,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : An(e) ? zt(e) : y(xo, null, String(e));
}
function zt(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : gs(e);
}
function ro(e, t) {
  let s = 0;
  const { shapeFlag: n } = e;
  if (t == null)
    t = null;
  else if (J(t))
    s = 16;
  else if (typeof t == "object")
    if (n & 65) {
      const o = t.default;
      o && (o._c && (o._d = !1), ro(e, o()), o._c && (o._d = !0));
      return;
    } else {
      s = 32;
      const o = t._;
      !o && !$i(t) ? t._ctx = et : o === 3 && et && (et.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else if (X(t)) {
    if (n & 65) {
      ro(e, { default: t });
      return;
    }
    t = { default: t, _ctx: et }, s = 32;
  } else
    t = String(t), n & 64 ? (s = 16, t = [_(t)]) : s = 8;
  e.children = t, e.shapeFlag |= s;
}
function ss(...e) {
  const t = {};
  for (let s = 0; s < e.length; s++) {
    const n = e[s];
    for (const o in n)
      if (o === "class")
        t.class !== n.class && (t.class = ot([t.class, n.class]));
      else if (o === "style")
        t.style = _n([t.style, n.style]);
      else if (io(o)) {
        const l = t[o], i = n[o];
        i && l !== i && !(J(l) && l.includes(i)) ? t[o] = l ? [].concat(l, i) : i : i == null && l == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !ao(o) && (t[o] = i);
      } else o !== "" && (t[o] = n[o]);
  }
  return t;
}
function It(e, t, s, n = null) {
  wt(e, t, 7, [
    s,
    n
  ]);
}
const Bd = Ei();
let Fd = 0;
function Hd(e, t, s) {
  const n = e.type, o = (t ? t.appContext : e.appContext) || Bd, l = {
    uid: Fd++,
    vnode: e,
    type: n,
    parent: t,
    appContext: o,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new au(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(o.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: Oi(n, o),
    emitsOptions: Ti(n, o),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: me,
    // inheritAttrs
    inheritAttrs: n.inheritAttrs,
    // state
    ctx: me,
    data: me,
    props: me,
    attrs: me,
    slots: me,
    refs: me,
    setupState: me,
    setupContext: null,
    // suspense related
    suspense: s,
    suspenseId: s ? s.pendingId : 0,
    asyncDep: null,
    asyncResolved: !1,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: !1,
    isUnmounted: !1,
    isDeactivated: !1,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  return l.ctx = { _: l }, l.root = t ? t.root : l, l.emit = xd.bind(null, l), e.ce && e.ce(l), l;
}
let Xe = null;
const rs = () => Xe || et;
let lo, rr;
{
  const e = mo(), t = (s, n) => {
    let o;
    return (o = e[s]) || (o = e[s] = []), o.push(n), (l) => {
      o.length > 1 ? o.forEach((i) => i(l)) : o[0](l);
    };
  };
  lo = t(
    "__VUE_INSTANCE_SETTERS__",
    (s) => Xe = s
  ), rr = t(
    "__VUE_SSR_SETTERS__",
    (s) => Vs = s
  );
}
const Rn = (e) => {
  const t = Xe;
  return lo(e), e.scope.on(), () => {
    e.scope.off(), lo(t);
  };
}, gl = () => {
  Xe && Xe.scope.off(), lo(null);
};
function Wi(e) {
  return e.vnode.shapeFlag & 4;
}
let Vs = !1;
function zd(e, t = !1, s = !1) {
  t && rr(t);
  const { props: n, children: o } = e.vnode, l = Wi(e);
  Ad(e, n, l, t), Pd(e, o, s || t);
  const i = l ? Wd(e, t) : void 0;
  return t && rr(!1), i;
}
function Wd(e, t) {
  const s = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, cd);
  const { setup: n } = s;
  if (n) {
    $t();
    const o = e.setupContext = n.length > 1 ? Kd(e) : null, l = Rn(e), i = In(
      n,
      e,
      0,
      [
        e.props,
        o
      ]
    ), a = Hl(i);
    if (Vt(), l(), (a || e.sp) && !Ps(e) && _r(e), a) {
      if (i.then(gl, gl), t)
        return i.then((u) => {
          hl(e, u);
        }).catch((u) => {
          Tn(u, e, 0);
        });
      e.asyncDep = i;
    } else
      hl(e, i);
  } else
    qi(e);
}
function hl(e, t, s) {
  X(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : xe(t) && (e.setupState = ci(t)), qi(e);
}
function qi(e, t, s) {
  const n = e.type;
  e.render || (e.render = n.render || Mt);
  {
    const o = Rn(e);
    $t();
    try {
      fd(e);
    } finally {
      Vt(), o();
    }
  }
}
const qd = {
  get(e, t) {
    return Ze(e, "get", ""), e[t];
  }
};
function Kd(e) {
  const t = (s) => {
    e.exposed = s || {};
  };
  return {
    attrs: new Proxy(e.attrs, qd),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function _o(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(ci(Tu(e.exposed)), {
    get(t, s) {
      if (s in t)
        return t[s];
      if (s in yn)
        return yn[s](e);
    },
    has(t, s) {
      return s in t || s in yn;
    }
  })) : e.proxy;
}
function Gd(e) {
  return X(e) && "__vccOpts" in e;
}
const ye = (e, t) => /* @__PURE__ */ Bu(e, t, Vs);
function Ho(e, t, s) {
  try {
    oo(-1);
    const n = arguments.length;
    return n === 2 ? xe(t) && !J(t) ? An(t) ? y(e, null, [t]) : y(e, t) : y(e, null, t) : (n > 3 ? s = Array.prototype.slice.call(arguments, 2) : n === 3 && An(s) && (s = [s]), y(e, t, s));
  } finally {
    oo(1);
  }
}
const Jd = "3.5.39";
/**
* @vue/runtime-dom v3.5.39
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let lr;
const bl = typeof window < "u" && window.trustedTypes;
if (bl)
  try {
    lr = /* @__PURE__ */ bl.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const Ki = lr ? (e) => lr.createHTML(e) : (e) => e, Yd = "http://www.w3.org/2000/svg", Qd = "http://www.w3.org/1998/Math/MathML", Ht = typeof document < "u" ? document : null, vl = Ht && /* @__PURE__ */ Ht.createElement("template"), Zd = {
  insert: (e, t, s) => {
    t.insertBefore(e, s || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, s, n) => {
    const o = t === "svg" ? Ht.createElementNS(Yd, e) : t === "mathml" ? Ht.createElementNS(Qd, e) : s ? Ht.createElement(e, { is: s }) : Ht.createElement(e);
    return e === "select" && n && n.multiple != null && o.setAttribute("multiple", n.multiple), o;
  },
  createText: (e) => Ht.createTextNode(e),
  createComment: (e) => Ht.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => Ht.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, s, n, o, l) {
    const i = s ? s.previousSibling : t.lastChild;
    if (o && (o === l || o.nextSibling))
      for (; t.insertBefore(o.cloneNode(!0), s), !(o === l || !(o = o.nextSibling)); )
        ;
    else {
      vl.innerHTML = Ki(
        n === "svg" ? `<svg>${e}</svg>` : n === "mathml" ? `<math>${e}</math>` : e
      );
      const a = vl.content;
      if (n === "svg" || n === "mathml") {
        const u = a.firstChild;
        for (; u.firstChild; )
          a.appendChild(u.firstChild);
        a.removeChild(u);
      }
      t.insertBefore(a, s);
    }
    return [
      // first
      i ? i.nextSibling : t.firstChild,
      // last
      s ? s.previousSibling : t.lastChild
    ];
  }
}, Xd = /* @__PURE__ */ Symbol("_vtc");
function ec(e, t, s) {
  const n = e[Xd];
  n && (t = (t ? [t, ...n] : [...n]).join(" ")), t == null ? e.removeAttribute("class") : s ? e.setAttribute("class", t) : e.className = t;
}
const yl = /* @__PURE__ */ Symbol("_vod"), tc = /* @__PURE__ */ Symbol("_vsh"), sc = /* @__PURE__ */ Symbol(""), nc = /(?:^|;)\s*display\s*:/;
function oc(e, t, s) {
  const n = e.style, o = Ve(s);
  let l = !1;
  if (s && !o) {
    if (t)
      if (Ve(t))
        for (const i of t.split(";")) {
          const a = i.slice(0, i.indexOf(":")).trim();
          s[a] == null && cn(n, a, "");
        }
      else
        for (const i in t)
          s[i] == null && cn(n, i, "");
    for (const i in s) {
      i === "display" && (l = !0);
      const a = s[i];
      a != null ? lc(
        e,
        i,
        !Ve(t) && t ? t[i] : void 0,
        a
      ) || cn(n, i, a) : cn(n, i, "");
    }
  } else if (o) {
    if (t !== s) {
      const i = n[sc];
      i && (s += ";" + i), n.cssText = s, l = nc.test(s);
    }
  } else t && e.removeAttribute("style");
  yl in e && (e[yl] = l ? n.display : "", e[tc] && (n.display = "none"));
}
const xl = /\s*!important$/;
function cn(e, t, s) {
  if (J(s))
    s.forEach((n) => cn(e, t, n));
  else if (s == null && (s = ""), t.startsWith("--"))
    e.setProperty(t, s);
  else {
    const n = rc(e, t);
    xl.test(s) ? e.setProperty(
      ut(n),
      s.replace(xl, ""),
      "important"
    ) : e[n] = s;
  }
}
const _l = ["Webkit", "Moz", "ms"], zo = {};
function rc(e, t) {
  const s = zo[t];
  if (s)
    return s;
  let n = Ge(t);
  if (n !== "filter" && n in e)
    return zo[t] = n;
  n = Wl(n);
  for (let o = 0; o < _l.length; o++) {
    const l = _l[o] + n;
    if (l in e)
      return zo[t] = l;
  }
  return t;
}
function lc(e, t, s, n) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && Ve(n) && s === n;
}
const wl = "http://www.w3.org/1999/xlink";
function kl(e, t, s, n, o, l = lu(t)) {
  n && t.startsWith("xlink:") ? s == null ? e.removeAttributeNS(wl, t.slice(6, t.length)) : e.setAttributeNS(wl, t, s) : s == null || l && !Kl(s) ? e.removeAttribute(t) : e.setAttribute(
    t,
    l ? "" : pt(s) ? String(s) : s
  );
}
function Sl(e, t, s, n, o) {
  if (t === "innerHTML" || t === "textContent") {
    s != null && (e[t] = t === "innerHTML" ? Ki(s) : s);
    return;
  }
  const l = e.tagName;
  if (t === "value" && l !== "PROGRESS" && // custom elements may use _value internally
  !l.includes("-")) {
    const a = l === "OPTION" ? e.getAttribute("value") || "" : e.value, u = s == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(s);
    (a !== u || !("_value" in e)) && (e.value = u), s == null && e.removeAttribute(t), e._value = s;
    return;
  }
  let i = !1;
  if (s === "" || s == null) {
    const a = typeof e[t];
    a === "boolean" ? s = Kl(s) : s == null && a === "string" ? (s = "", i = !0) : a === "number" && (s = 0, i = !0);
  }
  try {
    e[t] = s;
  } catch {
  }
  i && e.removeAttribute(o || t);
}
function Kt(e, t, s, n) {
  e.addEventListener(t, s, n);
}
function ic(e, t, s, n) {
  e.removeEventListener(t, s, n);
}
const Cl = /* @__PURE__ */ Symbol("_vei");
function ac(e, t, s, n, o = null) {
  const l = e[Cl] || (e[Cl] = {}), i = l[t];
  if (n && i)
    i.value = n;
  else {
    const [a, u] = cc(t);
    if (n) {
      const h = l[t] = mc(
        n,
        o
      );
      Kt(e, a, h, u);
    } else i && (ic(e, a, i, u), l[t] = void 0);
  }
}
const uc = /(Once|Passive|Capture)$/, dc = /^on:?(?:Once|Passive|Capture)$/;
function cc(e) {
  let t, s;
  for (; (s = e.match(uc)) && !dc.test(e); )
    t || (t = {}), e = e.slice(0, e.length - s[1].length), t[s[1].toLowerCase()] = !0;
  return [e[2] === ":" ? e.slice(3) : ut(e.slice(2)), t];
}
let Wo = 0;
const fc = /* @__PURE__ */ Promise.resolve(), pc = () => Wo || (fc.then(() => Wo = 0), Wo = Date.now());
function mc(e, t) {
  const s = (n) => {
    if (!n._vts)
      n._vts = Date.now();
    else if (n._vts <= s.attached)
      return;
    const o = s.value;
    if (J(o)) {
      const l = n.stopImmediatePropagation;
      n.stopImmediatePropagation = () => {
        l.call(n), n._stopped = !0;
      };
      const i = o.slice(), a = [n];
      for (let u = 0; u < i.length && !n._stopped; u++) {
        const h = i[u];
        h && wt(
          h,
          t,
          5,
          a
        );
      }
    } else
      wt(
        o,
        t,
        5,
        [n]
      );
  };
  return s.value = e, s.attached = pc(), s;
}
const Al = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, gc = (e, t, s, n, o, l) => {
  const i = o === "svg";
  t === "class" ? ec(e, n, i) : t === "style" ? oc(e, s, n) : io(t) ? ao(t) || ac(e, t, s, n, l) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : hc(e, t, n, i)) ? (Sl(e, t, n), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && kl(e, t, n, i, l, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (bc(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !Ve(n))) ? Sl(e, Ge(t), n, l, t) : (t === "true-value" ? e._trueValue = n : t === "false-value" && (e._falseValue = n), kl(e, t, n, i));
};
function hc(e, t, s, n) {
  if (n)
    return !!(t === "innerHTML" || t === "textContent" || t in e && Al(t) && X(s));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const o = e.tagName;
    if (o === "IMG" || o === "VIDEO" || o === "CANVAS" || o === "SOURCE")
      return !1;
  }
  return Al(t) && Ve(s) ? !1 : t in e;
}
function bc(e, t) {
  const s = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!s)
    return !1;
  const n = Ge(t);
  return Array.isArray(s) ? s.some((o) => Ge(o) === n) : Object.keys(s).some((o) => Ge(o) === n);
}
const El = {};
// @__NO_SIDE_EFFECTS__
function vc(e, t, s) {
  let n = /* @__PURE__ */ We(e, t);
  uo(n) && (n = Be({}, n, t));
  class o extends Ar {
    constructor(i) {
      super(n, i, s);
    }
  }
  return o.def = n, o;
}
const yc = typeof HTMLElement < "u" ? HTMLElement : class {
};
class Ar extends yc {
  constructor(t, s = {}, n = $l) {
    super(), this._def = t, this._props = s, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== $l ? this._root = this.shadowRoot : t.shadowRoot !== !1 ? (this.attachShadow(
      Be({}, t.shadowRootOptions, {
        mode: "open"
      })
    ), this._root = this.shadowRoot) : this._root = this;
  }
  connectedCallback() {
    if (!this.isConnected) return;
    !this.shadowRoot && !this._resolved && this._parseSlots(), this._connected = !0;
    let t = this;
    for (; t = t && // #12479 should check assignedSlot first to get correct parent
    (t.assignedSlot || t.parentNode || t.host); )
      if (t instanceof Ar) {
        this._parent = t;
        break;
      }
    this._instance || (this._resolved ? this._mount(this._def) : t && t._pendingResolve ? this._pendingResolve = t._pendingResolve.then(() => {
      this._pendingResolve = void 0, this._resolveDef();
    }) : this._resolveDef());
  }
  _setParent(t = this._parent) {
    t && (this._instance.parent = t._instance, this._inheritParentContext(t));
  }
  _inheritParentContext(t = this._parent) {
    t && this._app && Object.setPrototypeOf(
      this._app._context.provides,
      t._instance.provides
    );
  }
  disconnectedCallback() {
    this._connected = !1, Pn(() => {
      this._connected || (this._ob && (this._ob.disconnect(), this._ob = null), this._app && this._app.unmount(), this._instance && (this._instance.ce = void 0), this._app = this._instance = null, this._teleportTargets && (this._teleportTargets.clear(), this._teleportTargets = void 0));
    });
  }
  _processMutations(t) {
    for (const s of t)
      this._setAttr(s.attributeName);
  }
  /**
   * resolve inner component definition (handle possible async component)
   */
  _resolveDef() {
    if (this._pendingResolve)
      return;
    for (let n = 0; n < this.attributes.length; n++)
      this._setAttr(this.attributes[n].name);
    this._ob = new MutationObserver(this._processMutations.bind(this)), this._ob.observe(this, { attributes: !0 });
    const t = (n, o = !1) => {
      this._resolved = !0, this._pendingResolve = void 0;
      const { props: l, styles: i } = n;
      let a;
      if (l && !J(l))
        for (const u in l) {
          const h = l[u];
          (h === Number || h && h.type === Number) && (u in this._props && (this._props[u] = Xr(this._props[u])), (a || (a = /* @__PURE__ */ Object.create(null)))[Ge(u)] = !0);
        }
      this._numberProps = a, this._resolveProps(n), this.shadowRoot && this._applyStyles(i), this._mount(n);
    }, s = this._def.__asyncLoader;
    s ? this._pendingResolve = s().then((n) => {
      n.configureApp = this._def.configureApp, t(this._def = n, !0);
    }) : t(this._def);
  }
  _mount(t) {
    this._app = this._createApp(t), this._inheritParentContext(), t.configureApp && t.configureApp(this._app), this._app._ceVNode = this._createVNode(), this._app.mount(this._root);
    const s = this._instance && this._instance.exposed;
    if (s)
      for (const n in s)
        ve(this, n) || Object.defineProperty(this, n, {
          // unwrap ref to be consistent with public instance behavior
          get: () => m(s[n])
        });
  }
  _resolveProps(t) {
    const { props: s } = t, n = J(s) ? s : Object.keys(s || {});
    for (const o of Object.keys(this))
      o[0] !== "_" && n.includes(o) && this._setProp(o, this[o]);
    for (const o of n.map(Ge))
      Object.defineProperty(this, o, {
        get() {
          return this._getProp(o);
        },
        set(l) {
          this._setProp(o, l, !0, !this._patching);
        }
      });
  }
  _setAttr(t) {
    if (t.startsWith("data-v-")) return;
    const s = this.hasAttribute(t);
    let n = s ? this.getAttribute(t) : El;
    const o = Ge(t);
    s && this._numberProps && this._numberProps[o] && (n = Xr(n)), this._setProp(o, n, !1, !0);
  }
  /**
   * @internal
   */
  _getProp(t) {
    return this._props[t];
  }
  /**
   * @internal
   */
  _setProp(t, s, n = !0, o = !1) {
    if (s !== this._props[t] && (this._dirty = !0, s === El ? delete this._props[t] : (this._props[t] = s, t === "key" && this._app && (this._app._ceVNode.key = s)), o && this._instance && this._update(), n)) {
      const l = this._ob;
      l && (this._processMutations(l.takeRecords()), l.disconnect()), s === !0 ? this.setAttribute(ut(t), "") : typeof s == "string" || typeof s == "number" ? this.setAttribute(ut(t), s + "") : s || this.removeAttribute(ut(t)), l && l.observe(this, { attributes: !0 });
    }
  }
  _update() {
    const t = this._createVNode();
    this._app && (t.appContext = this._app._context), Tc(t, this._root);
  }
  _createVNode() {
    const t = {};
    this.shadowRoot || (t.onVnodeMounted = t.onVnodeUpdated = this._renderSlots.bind(this));
    const s = y(this._def, Be(t, this._props));
    return this._instance || (s.ce = (n) => {
      this._instance = n, n.ce = this, n.isCE = !0;
      const o = (l, i) => {
        this.dispatchEvent(
          new CustomEvent(
            l,
            uo(i[0]) ? Be({ detail: i }, i[0]) : { detail: i }
          )
        );
      };
      n.emit = (l, ...i) => {
        o(l, i), ut(l) !== l && o(ut(l), i);
      }, this._setParent();
    }), s;
  }
  _applyStyles(t, s, n) {
    if (!t) return;
    if (s) {
      if (s === this._def || this._styleChildren.has(s))
        return;
      this._styleChildren.add(s);
    }
    const o = this._nonce, l = this.shadowRoot, i = n ? this._getStyleAnchor(n) || this._getStyleAnchor(this._def) : this._getRootStyleInsertionAnchor(l);
    let a = null;
    for (let u = t.length - 1; u >= 0; u--) {
      const h = document.createElement("style");
      o && h.setAttribute("nonce", o), h.textContent = t[u], l.insertBefore(h, a || i), a = h, u === 0 && (n || this._styleAnchors.set(this._def, h), s && this._styleAnchors.set(s, h));
    }
  }
  _getStyleAnchor(t) {
    if (!t)
      return null;
    const s = this._styleAnchors.get(t);
    return s && s.parentNode === this.shadowRoot ? s : (s && this._styleAnchors.delete(t), null);
  }
  _getRootStyleInsertionAnchor(t) {
    for (let s = 0; s < t.childNodes.length; s++) {
      const n = t.childNodes[s];
      if (!(n instanceof HTMLStyleElement))
        return n;
    }
    return null;
  }
  /**
   * Only called when shadowRoot is false
   */
  _parseSlots() {
    const t = this._slots = {};
    let s;
    for (; s = this.firstChild; ) {
      const n = s.nodeType === 1 && s.getAttribute("slot") || "default";
      (t[n] || (t[n] = [])).push(s), this.removeChild(s);
    }
  }
  /**
   * Only called when shadowRoot is false
   */
  _renderSlots() {
    const t = this._getSlots(), s = this._instance.type.__scopeId;
    for (let n = 0; n < t.length; n++) {
      const o = t[n], l = o.getAttribute("name") || "default", i = this._slots[l], a = o.parentNode;
      if (i)
        for (const u of i) {
          if (s && u.nodeType === 1) {
            const h = s + "-s", g = document.createTreeWalker(u, 1);
            u.setAttribute(h, "");
            let x;
            for (; x = g.nextNode(); )
              x.setAttribute(h, "");
          }
          a.insertBefore(u, o);
        }
      else
        for (; o.firstChild; ) a.insertBefore(o.firstChild, o);
      a.removeChild(o);
    }
  }
  /**
   * @internal
   */
  _getSlots() {
    const t = [this];
    this._teleportTargets && t.push(...this._teleportTargets);
    const s = /* @__PURE__ */ new Set();
    for (const n of t) {
      const o = n.querySelectorAll("slot");
      for (let l = 0; l < o.length; l++)
        s.add(o[l]);
    }
    return Array.from(s);
  }
  /**
   * @internal
   */
  _injectChildStyle(t, s) {
    this._applyStyles(t.styles, t, s);
  }
  /**
   * @internal
   */
  _beginPatch() {
    this._patching = !0, this._dirty = !1;
  }
  /**
   * @internal
   */
  _endPatch() {
    this._patching = !1, this._dirty && this._instance && this._update();
  }
  /**
   * @internal
   */
  _hasShadowRoot() {
    return this._def.shadowRoot !== !1;
  }
  /**
   * @internal
   */
  _removeChildStyle(t) {
  }
}
const ns = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return J(t) ? (s) => Jn(t, s) : t;
};
function xc(e) {
  e.target.composing = !0;
}
function Il(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const vt = /* @__PURE__ */ Symbol("_assign");
function Tl(e, t, s) {
  return t && (e = e.trim()), s && (e = po(e)), e;
}
const ir = {
  created(e, { modifiers: { lazy: t, trim: s, number: n } }, o) {
    e[vt] = ns(o);
    const l = n || o.props && o.props.type === "number";
    Kt(e, t ? "change" : "input", (i) => {
      i.target.composing || e[vt](Tl(e.value, s, l));
    }), (s || l) && Kt(e, "change", () => {
      e.value = Tl(e.value, s, l);
    }), t || (Kt(e, "compositionstart", xc), Kt(e, "compositionend", Il), Kt(e, "change", Il));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: s, modifiers: { lazy: n, trim: o, number: l } }, i) {
    if (e[vt] = ns(i), e.composing) return;
    const a = (l || e.type === "number") && !/^0\d/.test(e.value) ? po(e.value) : e.value, u = t ?? "";
    if (a === u)
      return;
    const h = e.getRootNode();
    (h instanceof Document || h instanceof ShadowRoot) && h.activeElement === e && e.type !== "range" && (n && t === s || o && e.value.trim() === u) || (e.value = u);
  }
}, _c = {
  // #4096 array checkboxes need to be deep traversed
  deep: !0,
  created(e, t, s) {
    e[vt] = ns(s), Kt(e, "change", () => {
      const n = e._modelValue, o = Os(e), l = e.checked, i = e[vt];
      if (J(n)) {
        const a = cr(n, o), u = a !== -1;
        if (l && !u)
          i(n.concat(o));
        else if (!l && u) {
          const h = [...n];
          h.splice(a, 1), i(h);
        }
      } else if (js(n)) {
        const a = new Set(n);
        l ? a.add(o) : a.delete(o), i(a);
      } else
        i(Ji(e, l));
    });
  },
  // set initial checked on mount to wait for true-value/false-value
  mounted: Pl,
  beforeUpdate(e, t, s) {
    e[vt] = ns(s), Pl(e, t, s);
  }
};
function Pl(e, { value: t, oldValue: s }, n) {
  e._modelValue = t;
  let o;
  if (J(t))
    o = cr(t, n.props.value) > -1;
  else if (js(t))
    o = t.has(n.props.value);
  else {
    if (t === s) return;
    o = ts(t, Ji(e, !0));
  }
  e.checked !== o && (e.checked = o);
}
const wc = {
  created(e, { value: t }, s) {
    e.checked = ts(t, s.props.value), e[vt] = ns(s), Kt(e, "change", () => {
      e[vt](Os(e));
    });
  },
  beforeUpdate(e, { value: t, oldValue: s }, n) {
    e[vt] = ns(n), t !== s && (e.checked = ts(t, n.props.value));
  }
}, Gi = {
  // <select multiple> value need to be deep traversed
  deep: !0,
  created(e, { value: t, modifiers: { number: s } }, n) {
    const o = js(t);
    Kt(e, "change", () => {
      const l = Array.prototype.filter.call(e.options, (i) => i.selected).map(
        (i) => s ? po(Os(i)) : Os(i)
      );
      e[vt](
        e.multiple ? o ? new Set(l) : l : l[0]
      ), e._assigning = !0, Pn(() => {
        e._assigning = !1;
      });
    }), e[vt] = ns(n);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(e, { value: t }) {
    Rl(e, t);
  },
  beforeUpdate(e, t, s) {
    e[vt] = ns(s);
  },
  updated(e, { value: t }) {
    e._assigning || Rl(e, t);
  }
};
function Rl(e, t) {
  const s = e.multiple, n = J(t);
  if (!(s && !n && !js(t))) {
    for (let o = 0, l = e.options.length; o < l; o++) {
      const i = e.options[o], a = Os(i);
      if (s)
        if (n) {
          const u = typeof a;
          u === "string" || u === "number" ? i.selected = t.some((h) => String(h) === String(a)) : i.selected = cr(t, a) > -1;
        } else
          i.selected = t.has(a);
      else if (ts(Os(i), t)) {
        e.selectedIndex !== o && (e.selectedIndex = o);
        return;
      }
    }
    !s && e.selectedIndex !== -1 && (e.selectedIndex = -1);
  }
}
function Os(e) {
  return "_value" in e ? e._value : e.value;
}
function Ji(e, t) {
  const s = t ? "_trueValue" : "_falseValue";
  return s in e ? e[s] : t;
}
const kc = {
  created(e, t, s) {
    qn(e, t, s, null, "created");
  },
  mounted(e, t, s) {
    qn(e, t, s, null, "mounted");
  },
  beforeUpdate(e, t, s, n) {
    qn(e, t, s, n, "beforeUpdate");
  },
  updated(e, t, s, n) {
    qn(e, t, s, n, "updated");
  }
};
function Sc(e, t) {
  switch (e) {
    case "SELECT":
      return Gi;
    case "TEXTAREA":
      return ir;
    default:
      switch (t) {
        case "checkbox":
          return _c;
        case "radio":
          return wc;
        default:
          return ir;
      }
  }
}
function qn(e, t, s, n, o) {
  const i = Sc(
    e.tagName,
    s.props && s.props.type
  )[o];
  i && i(e, t, s, n);
}
const Cc = ["ctrl", "shift", "alt", "meta"], Ac = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !e.ctrlKey,
  shift: (e) => !e.shiftKey,
  alt: (e) => !e.altKey,
  meta: (e) => !e.metaKey,
  left: (e) => "button" in e && e.button !== 0,
  middle: (e) => "button" in e && e.button !== 1,
  right: (e) => "button" in e && e.button !== 2,
  exact: (e, t) => Cc.some((s) => e[`${s}Key`] && !t.includes(s))
}, fn = (e, t) => {
  if (!e) return e;
  const s = e._withMods || (e._withMods = {}), n = t.join(".");
  return s[n] || (s[n] = ((o, ...l) => {
    for (let i = 0; i < t.length; i++) {
      const a = Ac[t[i]];
      if (a && a(o, t)) return;
    }
    return e(o, ...l);
  }));
}, Ec = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, pn = (e, t) => {
  const s = e._withKeys || (e._withKeys = {}), n = t.join(".");
  return s[n] || (s[n] = ((o) => {
    if (!("key" in o))
      return;
    const l = ut(o.key);
    if (t.some(
      (i) => i === l || Ec[i] === l
    ))
      return e(o);
  }));
}, Ic = /* @__PURE__ */ Be({ patchProp: gc }, Zd);
let Ml;
function Yi() {
  return Ml || (Ml = Md(Ic));
}
const Tc = ((...e) => {
  Yi().render(...e);
}), $l = ((...e) => {
  const t = Yi().createApp(...e), { mount: s } = t;
  return t.mount = (n) => {
    const o = Rc(n);
    if (!o) return;
    const l = t._component;
    !X(l) && !l.render && !l.template && (l.template = o.innerHTML), o.nodeType === 1 && (o.textContent = "");
    const i = s(o, !1, Pc(o));
    return o instanceof Element && (o.removeAttribute("v-cloak"), o.setAttribute("data-v-app", "")), i;
  }, t;
});
function Pc(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function Rc(e) {
  return Ve(e) ? document.querySelector(e) : e;
}
function Qi(e) {
  var t, s, n = "";
  if (typeof e == "string" || typeof e == "number") n += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (s = Qi(e[t])) && (n && (n += " "), n += s);
  } else for (s in e) e[s] && (n && (n += " "), n += s);
  return n;
}
function Zi() {
  for (var e, t, s = 0, n = "", o = arguments.length; s < o; s++) (e = arguments[s]) && (t = Qi(e)) && (n && (n += " "), n += t);
  return n;
}
const Vl = (e) => typeof e == "boolean" ? `${e}` : e === 0 ? "0" : e, Ol = Zi, Xi = (e, t) => (s) => {
  var n;
  if ((t == null ? void 0 : t.variants) == null) return Ol(e, s == null ? void 0 : s.class, s == null ? void 0 : s.className);
  const { variants: o, defaultVariants: l } = t, i = Object.keys(o).map((h) => {
    const g = s == null ? void 0 : s[h], x = l == null ? void 0 : l[h];
    if (g === null) return null;
    const A = Vl(g) || Vl(x);
    return o[h][A];
  }), a = s && Object.entries(s).reduce((h, g) => {
    let [x, A] = g;
    return A === void 0 || (h[x] = A), h;
  }, {}), u = t == null || (n = t.compoundVariants) === null || n === void 0 ? void 0 : n.reduce((h, g) => {
    let { class: x, className: A, ...k } = g;
    return Object.entries(k).every((O) => {
      let [v, F] = O;
      return Array.isArray(F) ? F.includes({
        ...l,
        ...a
      }[v]) : {
        ...l,
        ...a
      }[v] === F;
    }) ? [
      ...h,
      x,
      A
    ] : h;
  }, []);
  return Ol(e, i, u, s == null ? void 0 : s.class, s == null ? void 0 : s.className);
}, Mc = Xi(
  "inline-flex items-center justify-center rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        sm: "rounded-md px-3 py-1",
        md: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
), Er = "-", $c = (e) => {
  const t = Oc(e), {
    conflictingClassGroups: s,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (i) => {
      const a = i.split(Er);
      return a[0] === "" && a.length !== 1 && a.shift(), ea(a, t) || Vc(i);
    },
    getConflictingClassGroupIds: (i, a) => {
      const u = s[i] || [];
      return a && n[i] ? [...u, ...n[i]] : u;
    }
  };
}, ea = (e, t) => {
  var i;
  if (e.length === 0)
    return t.classGroupId;
  const s = e[0], n = t.nextPart.get(s), o = n ? ea(e.slice(1), n) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const l = e.join(Er);
  return (i = t.validators.find(({
    validator: a
  }) => a(l))) == null ? void 0 : i.classGroupId;
}, jl = /^\[(.+)\]$/, Vc = (e) => {
  if (jl.test(e)) {
    const t = jl.exec(e)[1], s = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (s)
      return "arbitrary.." + s;
  }
}, Oc = (e) => {
  const {
    theme: t,
    prefix: s
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return Nc(Object.entries(e.classGroups), s).forEach(([l, i]) => {
    ar(i, n, l, t);
  }), n;
}, ar = (e, t, s, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const l = o === "" ? t : Nl(t, o);
      l.classGroupId = s;
      return;
    }
    if (typeof o == "function") {
      if (jc(o)) {
        ar(o(n), t, s, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: s
      });
      return;
    }
    Object.entries(o).forEach(([l, i]) => {
      ar(i, Nl(t, l), s, n);
    });
  });
}, Nl = (e, t) => {
  let s = e;
  return t.split(Er).forEach((n) => {
    s.nextPart.has(n) || s.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), s = s.nextPart.get(n);
  }), s;
}, jc = (e) => e.isThemeGetter, Nc = (e, t) => t ? e.map(([s, n]) => {
  const o = n.map((l) => typeof l == "string" ? t + l : typeof l == "object" ? Object.fromEntries(Object.entries(l).map(([i, a]) => [t + i, a])) : l);
  return [s, o];
}) : e, Lc = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, s = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (l, i) => {
    s.set(l, i), t++, t > e && (t = 0, n = s, s = /* @__PURE__ */ new Map());
  };
  return {
    get(l) {
      let i = s.get(l);
      if (i !== void 0)
        return i;
      if ((i = n.get(l)) !== void 0)
        return o(l, i), i;
    },
    set(l, i) {
      s.has(l) ? s.set(l, i) : o(l, i);
    }
  };
}, ta = "!", Uc = (e) => {
  const {
    separator: t,
    experimentalParseClassName: s
  } = e, n = t.length === 1, o = t[0], l = t.length, i = (a) => {
    const u = [];
    let h = 0, g = 0, x;
    for (let F = 0; F < a.length; F++) {
      let z = a[F];
      if (h === 0) {
        if (z === o && (n || a.slice(F, F + l) === t)) {
          u.push(a.slice(g, F)), g = F + l;
          continue;
        }
        if (z === "/") {
          x = F;
          continue;
        }
      }
      z === "[" ? h++ : z === "]" && h--;
    }
    const A = u.length === 0 ? a : a.substring(g), k = A.startsWith(ta), O = k ? A.substring(1) : A, v = x && x > g ? x - g : void 0;
    return {
      modifiers: u,
      hasImportantModifier: k,
      baseClassName: O,
      maybePostfixModifierPosition: v
    };
  };
  return s ? (a) => s({
    className: a,
    parseClassName: i
  }) : i;
}, Dc = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let s = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...s.sort(), n), s = []) : s.push(n);
  }), t.push(...s.sort()), t;
}, Bc = (e) => ({
  cache: Lc(e.cacheSize),
  parseClassName: Uc(e),
  ...$c(e)
}), Fc = /\s+/, Hc = (e, t) => {
  const {
    parseClassName: s,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, l = [], i = e.trim().split(Fc);
  let a = "";
  for (let u = i.length - 1; u >= 0; u -= 1) {
    const h = i[u], {
      modifiers: g,
      hasImportantModifier: x,
      baseClassName: A,
      maybePostfixModifierPosition: k
    } = s(h);
    let O = !!k, v = n(O ? A.substring(0, k) : A);
    if (!v) {
      if (!O) {
        a = h + (a.length > 0 ? " " + a : a);
        continue;
      }
      if (v = n(A), !v) {
        a = h + (a.length > 0 ? " " + a : a);
        continue;
      }
      O = !1;
    }
    const F = Dc(g).join(":"), z = x ? F + ta : F, D = z + v;
    if (l.includes(D))
      continue;
    l.push(D);
    const K = o(v, O);
    for (let U = 0; U < K.length; ++U) {
      const Z = K[U];
      l.push(z + Z);
    }
    a = h + (a.length > 0 ? " " + a : a);
  }
  return a;
};
function zc() {
  let e = 0, t, s, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (s = sa(t)) && (n && (n += " "), n += s);
  return n;
}
const sa = (e) => {
  if (typeof e == "string")
    return e;
  let t, s = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = sa(e[n])) && (s && (s += " "), s += t);
  return s;
};
function Wc(e, ...t) {
  let s, n, o, l = i;
  function i(u) {
    const h = t.reduce((g, x) => x(g), e());
    return s = Bc(h), n = s.cache.get, o = s.cache.set, l = a, a(u);
  }
  function a(u) {
    const h = n(u);
    if (h)
      return h;
    const g = Hc(u, s);
    return o(u, g), g;
  }
  return function() {
    return l(zc.apply(null, arguments));
  };
}
const Ee = (e) => {
  const t = (s) => s[e] || [];
  return t.isThemeGetter = !0, t;
}, na = /^\[(?:([a-z-]+):)?(.+)\]$/i, qc = /^\d+\/\d+$/, Kc = /* @__PURE__ */ new Set(["px", "full", "screen"]), Gc = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Jc = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Yc = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/, Qc = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Zc = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Bt = (e) => Ms(e) || Kc.has(e) || qc.test(e), Zt = (e) => Ns(e, "length", lf), Ms = (e) => !!e && !Number.isNaN(Number(e)), qo = (e) => Ns(e, "number", Ms), ln = (e) => !!e && Number.isInteger(Number(e)), Xc = (e) => e.endsWith("%") && Ms(e.slice(0, -1)), se = (e) => na.test(e), Xt = (e) => Gc.test(e), ef = /* @__PURE__ */ new Set(["length", "size", "percentage"]), tf = (e) => Ns(e, ef, oa), sf = (e) => Ns(e, "position", oa), nf = /* @__PURE__ */ new Set(["image", "url"]), of = (e) => Ns(e, nf, uf), rf = (e) => Ns(e, "", af), an = () => !0, Ns = (e, t, s) => {
  const n = na.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : s(n[2]) : !1;
}, lf = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Jc.test(e) && !Yc.test(e)
), oa = () => !1, af = (e) => Qc.test(e), uf = (e) => Zc.test(e), df = () => {
  const e = Ee("colors"), t = Ee("spacing"), s = Ee("blur"), n = Ee("brightness"), o = Ee("borderColor"), l = Ee("borderRadius"), i = Ee("borderSpacing"), a = Ee("borderWidth"), u = Ee("contrast"), h = Ee("grayscale"), g = Ee("hueRotate"), x = Ee("invert"), A = Ee("gap"), k = Ee("gradientColorStops"), O = Ee("gradientColorStopPositions"), v = Ee("inset"), F = Ee("margin"), z = Ee("opacity"), D = Ee("padding"), K = Ee("saturate"), U = Ee("scale"), Z = Ee("sepia"), Oe = Ee("skew"), q = Ee("space"), te = Ee("translate"), je = () => ["auto", "contain", "none"], ke = () => ["auto", "hidden", "clip", "visible", "scroll"], Re = () => ["auto", se, t], ae = () => [se, t], ge = () => ["", Bt, Zt], Je = () => ["auto", Ms, se], dt = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], Ce = () => ["solid", "dashed", "dotted", "double", "none"], de = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], ne = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], Ae = () => ["", "0", se], Me = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], Le = () => [Ms, se];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [an],
      spacing: [Bt, Zt],
      blur: ["none", "", Xt, se],
      brightness: Le(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Xt, se],
      borderSpacing: ae(),
      borderWidth: ge(),
      contrast: Le(),
      grayscale: Ae(),
      hueRotate: Le(),
      invert: Ae(),
      gap: ae(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Xc, Zt],
      inset: Re(),
      margin: Re(),
      opacity: Le(),
      padding: ae(),
      saturate: Le(),
      scale: Le(),
      sepia: Ae(),
      skew: Le(),
      space: ae(),
      translate: ae()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", se]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [Xt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": Me()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": Me()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...dt(), se]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: ke()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": ke()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": ke()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: je()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": je()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": je()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [v]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [v]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [v]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [v]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [v]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [v]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [v]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [v]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [v]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", ln, se]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: Re()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", se]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: Ae()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: Ae()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", ln, se]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [an]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", ln, se]
        }, se]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": Je()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": Je()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [an]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [ln, se]
        }, se]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": Je()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": Je()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", se]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", se]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [A]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [A]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [A]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...ne()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...ne(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...ne(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [D]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [D]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [D]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [D]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [D]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [D]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [D]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [D]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [D]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [F]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [F]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [F]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [F]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [F]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [F]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [F]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [F]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [F]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [q]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [q]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", se, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [se, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [se, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Xt]
        }, Xt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [se, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [se, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [se, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [se, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Xt, Zt]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", qo]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [an]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", se]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Ms, qo]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Bt, se]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", se]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", se]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [e]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [z]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [e]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [z]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...Ce(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Bt, Zt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Bt, se]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [e]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: ae()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", se]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", se]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [z]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...dt(), sf]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", tf]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, of]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [e]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [O]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [O]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [O]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [k]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [k]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [k]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [l]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [l]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [l]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [l]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [l]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [l]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [l]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [l]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [l]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [l]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [l]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [l]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [l]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [l]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [l]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [a]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [a]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [a]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [a]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [a]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [a]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [a]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [a]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [a]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [z]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...Ce(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [a]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [a]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [z]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: Ce()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [o]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [o]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [o]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [o]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [o]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [o]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [o]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [o]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [o]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [o]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...Ce()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Bt, se]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Bt, Zt]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [e]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: ge()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [e]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [z]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Bt, Zt]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [e]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", Xt, rf]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [an]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [z]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...de(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": de()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [s]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [n]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [u]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Xt, se]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [h]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [g]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [x]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [K]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [Z]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [s]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [n]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [u]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [h]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [g]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [x]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [z]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [K]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [Z]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [i]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [i]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [i]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", se]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: Le()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", se]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: Le()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", se]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [U]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [U]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [U]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [ln, se]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [te]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [te]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [Oe]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [Oe]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", se]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", e]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", se]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [e]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": ae()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": ae()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": ae()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": ae()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": ae()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": ae()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": ae()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": ae()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": ae()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": ae()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": ae()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": ae()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": ae()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": ae()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": ae()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": ae()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": ae()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": ae()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", se]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [e, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [Bt, Zt, qo]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [e, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
}, cf = /* @__PURE__ */ Wc(df);
function wo(...e) {
  return cf(Zi(e));
}
const ff = ["disabled"], fe = /* @__PURE__ */ We({
  __name: "Button",
  props: {
    variant: { default: "primary", type: null },
    size: { default: "md", type: null },
    class: { type: String },
    disabled: { type: Boolean, default: !1 }
  },
  emits: ["click"],
  setup(e, { emit: t }) {
    const s = e, n = t, o = ye(
      () => wo(
        Mc({ variant: s.variant, size: s.size }),
        s.disabled && "pointer-events-none opacity-50",
        s.class
      )
    );
    function l(i) {
      s.disabled || n("click", i);
    }
    return (i, a) => (C(), R("button", {
      type: "button",
      class: ot(o.value),
      disabled: e.disabled,
      onClick: l
    }, [
      os(i.$slots, "default")
    ], 10, ff));
  }
});
function pf(e, t) {
  const s = `${e}Context`, n = Symbol(s);
  return [(i) => {
    const a = bn(n, i);
    if (a || a === null) return a;
    throw new Error(`Injection \`${n.toString()}\` not found. Component must be used within ${Array.isArray(e) ? `one of the following components: ${e.join(", ")}` : `\`${e}\``}`);
  }, (i) => (vi(n, i), i)];
}
typeof WorkerGlobalScope < "u" && globalThis instanceof WorkerGlobalScope;
const mf = (e) => typeof e < "u";
function Ir(e) {
  var t;
  const s = di(e);
  return (t = s == null ? void 0 : s.$el) !== null && t !== void 0 ? t : s;
}
function gf(e) {
  return JSON.parse(JSON.stringify(e));
}
// @__NO_SIDE_EFFECTS__
function hf(e, t, s, n = {}) {
  var o, l;
  const { clone: i = !1, passive: a = !1, eventName: u, deep: h = !1, defaultValue: g, shouldEmit: x } = n, A = rs(), k = s || (A == null ? void 0 : A.emit) || (A == null || (o = A.$emit) === null || o === void 0 ? void 0 : o.bind(A)) || (A == null || (l = A.proxy) === null || l === void 0 || (l = l.$emit) === null || l === void 0 ? void 0 : l.bind(A == null ? void 0 : A.proxy));
  let O = u;
  O = O || `update:${t.toString()}`;
  const v = (D) => i ? typeof i == "function" ? i(D) : gf(D) : D, F = () => mf(e[t]) ? v(e[t]) : g, z = (D) => {
    x ? x(D) && k(O, D) : k(O, D);
  };
  if (a) {
    const D = /* @__PURE__ */ N(F());
    let K = !1;
    return bt(() => e[t], (U) => {
      K || (K = !0, D.value = v(U), Pn(() => K = !1));
    }), bt(D, (U) => {
      !K && (U !== e[t] || h) && z(U);
    }, { deep: h }), D;
  } else return ye({
    get() {
      return F();
    },
    set(D) {
      z(D);
    }
  });
}
function ra(e) {
  return e ? e.flatMap((t) => t.type === ue ? ra(t.children) : [t]) : [];
}
function bf(e) {
  const t = rs(), s = t == null ? void 0 : t.type.emits, n = {};
  return s != null && s.length || console.warn(`No emitted event found. Please check component: ${t == null ? void 0 : t.type.__name}`), s == null || s.forEach((o) => {
    n[Gn(Ge(o))] = (...l) => e(o, ...l);
  }), n;
}
function vf(e) {
  return ye(() => {
    var t;
    return di(e) ? !!((t = Ir(e)) != null && t.closest("form")) : !0;
  });
}
function la() {
  const e = rs(), t = /* @__PURE__ */ N(), s = ye(() => n());
  wi(() => {
    s.value !== n() && Mu(t);
  });
  function n() {
    return t.value && "$el" in t.value && ["#text", "#comment"].includes(t.value.$el.nodeName) ? t.value.$el.nextElementSibling : Ir(t);
  }
  const o = Object.assign({}, e.exposed), l = {};
  for (const a in e.props) Object.defineProperty(l, a, {
    enumerable: !0,
    configurable: !0,
    get: () => e.props[a]
  });
  if (Object.keys(o).length > 0) for (const a in o) Object.defineProperty(l, a, {
    enumerable: !0,
    configurable: !0,
    get: () => o[a]
  });
  Object.defineProperty(l, "$el", {
    enumerable: !0,
    configurable: !0,
    get: () => e.vnode.el
  }), e.exposed = l;
  function i(a) {
    if (t.value = a, !!a && (Object.defineProperty(l, "$el", {
      enumerable: !0,
      configurable: !0,
      get: () => a instanceof Element ? a : a.$el
    }), !(a instanceof Element) && !Object.hasOwn(a, "$el"))) {
      const u = a.$.exposed, h = Object.assign({}, l);
      for (const g in u) Object.defineProperty(h, g, {
        enumerable: !0,
        configurable: !0,
        get: () => u[g]
      });
      e.exposed = h;
    }
  }
  return {
    forwardRef: i,
    currentRef: t,
    currentElement: s
  };
}
function yf(e) {
  const t = rs(), s = Object.keys((t == null ? void 0 : t.type.props) ?? {}).reduce((o, l) => {
    const i = (t == null ? void 0 : t.type.props[l]).default;
    return i !== void 0 && (o[l] = i), o;
  }, {}), n = /* @__PURE__ */ Uu(e);
  return ye(() => {
    const o = {}, l = (t == null ? void 0 : t.vnode.props) ?? {};
    return Object.keys(l).forEach((i) => {
      o[Ge(i)] = l[i];
    }), Object.keys({
      ...s,
      ...o
    }).reduce((i, a) => (n.value[a] !== void 0 && (i[a] = n.value[a]), i), {});
  });
}
function xf(e, t) {
  const s = yf(e), n = t ? bf(t) : {};
  return ye(() => ({
    ...s.value,
    ...n
  }));
}
function _f() {
  var t, s;
  const e = (s = (t = rs()) == null ? void 0 : t.vnode) == null ? void 0 : s.scopeId;
  return e ? { [e]: "" } : {};
}
const wf = /* @__PURE__ */ We({
  name: "PrimitiveSlot",
  inheritAttrs: !1,
  setup(e, { attrs: t, slots: s }) {
    return () => {
      var u;
      if (!s.default) return null;
      const n = ra(s.default()), o = n.findIndex((h) => h.type !== Ot);
      if (o === -1) return n;
      const l = n[o];
      (u = l.props) == null || delete u.ref;
      const i = l.props ? ss(t, l.props) : t, a = gs({
        ...l,
        props: {}
      }, i);
      return n.length === 1 ? a : (n[o] = a, n);
    };
  }
}), kf = [
  "area",
  "img",
  "input"
], Tr = /* @__PURE__ */ We({
  name: "Primitive",
  inheritAttrs: !1,
  props: {
    asChild: {
      type: Boolean,
      default: !1
    },
    as: {
      type: [String, Object],
      default: "div"
    }
  },
  setup(e, { attrs: t, slots: s }) {
    const n = e.asChild ? "template" : e.as;
    return typeof n == "string" && kf.includes(n) ? () => Ho(n, t) : n !== "template" ? () => Ho(e.as, t, { default: s.default }) : () => Ho(wf, t, { default: s.default });
  }
});
function Sf() {
  const e = /* @__PURE__ */ N(), t = ye(() => {
    var s, n;
    return ["#text", "#comment"].includes((s = e.value) == null ? void 0 : s.$el.nodeName) ? (n = e.value) == null ? void 0 : n.$el.nextElementSibling : Ir(e);
  });
  return {
    primitiveElement: e,
    currentElement: t
  };
}
var Cf = /* @__PURE__ */ We({
  __name: "VisuallyHidden",
  props: {
    feature: {
      type: String,
      required: !1,
      default: "focusable"
    },
    asChild: {
      type: Boolean,
      required: !1
    },
    as: {
      type: null,
      required: !1,
      default: "span"
    }
  },
  setup(e) {
    return (t, s) => (C(), Ie(m(Tr), {
      as: t.as,
      "as-child": t.asChild,
      "aria-hidden": t.feature === "focusable" || t.feature === "fully-hidden" ? "true" : void 0,
      "data-hidden": t.feature === "fully-hidden" ? "" : void 0,
      tabindex: t.feature === "fully-hidden" ? "-1" : void 0,
      style: {
        position: "absolute",
        border: 0,
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        clipPath: "inset(50%)",
        whiteSpace: "nowrap",
        wordWrap: "normal",
        top: "-1px",
        left: "-1px"
      }
    }, {
      default: S(() => [os(t.$slots, "default")]),
      _: 3
    }, 8, [
      "as",
      "as-child",
      "aria-hidden",
      "data-hidden",
      "tabindex"
    ]));
  }
}), Af = Cf, Ef = /* @__PURE__ */ We({
  inheritAttrs: !1,
  __name: "VisuallyHiddenInputBubble",
  props: {
    name: {
      type: String,
      required: !0
    },
    value: {
      type: null,
      required: !0
    },
    checked: {
      type: Boolean,
      required: !1,
      default: void 0
    },
    required: {
      type: Boolean,
      required: !1
    },
    disabled: {
      type: Boolean,
      required: !1
    },
    feature: {
      type: String,
      required: !1,
      default: "fully-hidden"
    }
  },
  setup(e) {
    const t = e, { primitiveElement: s, currentElement: n } = Sf(), o = ye(() => t.checked ?? t.value);
    return bt(o, (l, i) => {
      if (!n.value) return;
      const a = n.value, u = window.HTMLInputElement.prototype, g = Object.getOwnPropertyDescriptor(u, "value").set;
      if (g && l !== i) {
        const x = new Event("input", { bubbles: !0 }), A = new Event("change", { bubbles: !0 });
        g.call(a, l), a.dispatchEvent(x), a.dispatchEvent(A);
      }
    }), (l, i) => (C(), Ie(Af, ss({
      ref_key: "primitiveElement",
      ref: s
    }, {
      ...t,
      ...l.$attrs
    }, { as: "input" }), null, 16));
  }
}), Ll = Ef, If = /* @__PURE__ */ We({
  inheritAttrs: !1,
  __name: "VisuallyHiddenInput",
  props: {
    name: {
      type: String,
      required: !0
    },
    value: {
      type: null,
      required: !0
    },
    checked: {
      type: Boolean,
      required: !1,
      default: void 0
    },
    required: {
      type: Boolean,
      required: !1
    },
    disabled: {
      type: Boolean,
      required: !1
    },
    feature: {
      type: String,
      required: !1,
      default: "fully-hidden"
    }
  },
  setup(e) {
    const t = e, s = ye(() => typeof t.value == "object" && Array.isArray(t.value) && t.value.length === 0 && t.required), n = ye(() => typeof t.value == "string" || typeof t.value == "number" || typeof t.value == "boolean" || t.value === null || t.value === void 0 ? [{
      name: t.name,
      value: t.value
    }] : typeof t.value == "object" && Array.isArray(t.value) ? t.value.flatMap((o, l) => typeof o == "object" ? Object.entries(o).map(([i, a]) => ({
      name: `${t.name}[${l}][${i}]`,
      value: a
    })) : {
      name: `${t.name}[${l}]`,
      value: o
    }) : t.value !== null && typeof t.value == "object" && !Array.isArray(t.value) ? Object.entries(t.value).map(([o, l]) => ({
      name: `${t.name}[${o}]`,
      value: l
    })) : []);
    return (o, l) => (C(), R(ue, null, [W(" We render single input if it's required "), s.value ? (C(), Ie(Ll, ss({ key: o.name }, {
      ...t,
      ...o.$attrs
    }, {
      name: o.name,
      value: o.value
    }), null, 16, ["name", "value"])) : (C(!0), R(ue, { key: 1 }, Qe(n.value, (i) => (C(), Ie(Ll, ss({ key: i.name }, { ref_for: !0 }, {
      ...t,
      ...o.$attrs
    }, {
      name: i.name,
      value: i.value
    }), null, 16, ["name", "value"]))), 128))], 2112));
  }
}), Tf = If;
const [Pf, Rf] = /* @__PURE__ */ pf("SwitchRoot");
var Mf = /* @__PURE__ */ We({
  inheritAttrs: !1,
  __name: "SwitchRoot",
  props: {
    defaultValue: {
      type: null,
      required: !1
    },
    modelValue: {
      type: null,
      required: !1,
      default: void 0
    },
    disabled: {
      type: Boolean,
      required: !1
    },
    id: {
      type: String,
      required: !1
    },
    value: {
      type: String,
      required: !1,
      default: "on"
    },
    trueValue: {
      type: null,
      required: !1,
      default: () => !0
    },
    falseValue: {
      type: null,
      required: !1,
      default: () => !1
    },
    asChild: {
      type: Boolean,
      required: !1
    },
    as: {
      type: null,
      required: !1,
      default: "button"
    },
    name: {
      type: String,
      required: !1
    },
    required: {
      type: Boolean,
      required: !1
    }
  },
  emits: ["update:modelValue"],
  setup(e, { emit: t }) {
    const s = e, n = t, { disabled: o } = /* @__PURE__ */ ju(s), l = /* @__PURE__ */ hf(s, "modelValue", n, {
      defaultValue: s.defaultValue ?? s.falseValue,
      passive: s.modelValue === void 0
    }), i = ye(() => l.value === s.trueValue);
    function a() {
      o.value || (l.value = i.value ? s.falseValue : s.trueValue);
    }
    const { forwardRef: u, currentElement: h } = la(), g = vf(h), x = _f(), A = ye(() => {
      var k;
      return s.id && h.value ? (k = document.querySelector(`[for="${s.id}"]`)) == null ? void 0 : k.innerText : void 0;
    });
    return Rf({
      checked: i,
      toggleCheck: a,
      disabled: o
    }), (k, O) => (C(), R(ue, null, [y(m(Tr), ss({
      id: k.id,
      ref: m(u),
      role: "switch",
      type: k.as === "button" ? "button" : void 0,
      value: k.value,
      "aria-label": k.$attrs["aria-label"] || A.value,
      "aria-checked": i.value,
      "aria-required": k.required,
      "data-state": i.value ? "checked" : "unchecked",
      "data-disabled": m(o) ? "" : void 0,
      "as-child": k.asChild,
      as: k.as,
      disabled: m(o)
    }, {
      ...m(x),
      ...k.$attrs
    }, {
      onClick: a,
      onKeydown: pn(fn(a, ["prevent"]), ["enter"])
    }), {
      default: S(() => [os(k.$slots, "default", {
        modelValue: m(l),
        checked: i.value
      })]),
      _: 3
    }, 16, [
      "id",
      "type",
      "value",
      "aria-label",
      "aria-checked",
      "aria-required",
      "data-state",
      "data-disabled",
      "as-child",
      "as",
      "disabled",
      "onKeydown"
    ]), m(g) && k.name ? (C(), Ie(m(Tf), ss({
      key: 0,
      type: "checkbox",
      name: k.name,
      disabled: m(o),
      required: k.required,
      value: k.value,
      checked: i.value
    }, m(x)), null, 16, [
      "name",
      "disabled",
      "required",
      "value",
      "checked"
    ])) : W("v-if", !0)], 64));
  }
}), $f = Mf, Vf = /* @__PURE__ */ We({
  __name: "SwitchThumb",
  props: {
    asChild: {
      type: Boolean,
      required: !1
    },
    as: {
      type: null,
      required: !1,
      default: "span"
    }
  },
  setup(e) {
    const t = Pf();
    return la(), (s, n) => (C(), Ie(m(Tr), {
      "data-state": m(t).checked.value ? "checked" : "unchecked",
      "data-disabled": m(t).disabled.value ? "" : void 0,
      "as-child": s.asChild,
      as: s.as
    }, {
      default: S(() => [os(s.$slots, "default")]),
      _: 3
    }, 8, [
      "data-state",
      "data-disabled",
      "as-child",
      "as"
    ]));
  }
}), Of = Vf;
const un = /* @__PURE__ */ We({
  __name: "Switch",
  props: {
    defaultValue: { type: null },
    modelValue: { type: null },
    disabled: { type: Boolean },
    id: { type: String },
    value: { type: String },
    trueValue: { type: null },
    falseValue: { type: null },
    asChild: { type: Boolean },
    as: { type: null },
    name: { type: String },
    required: { type: Boolean },
    class: { type: String }
  },
  emits: ["update:modelValue"],
  setup(e, { emit: t }) {
    const s = e, n = t, o = ye(() => {
      const { class: i, ...a } = s;
      return a;
    }), l = xf(o, n);
    return (i, a) => (C(), Ie(m($f), ss(m(l), {
      as: "button",
      type: "button",
      class: m(wo)(
        "peer focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-input inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
        s.class
      )
    }), {
      default: S(() => [
        y(m(Of), { class: "bg-background pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" })
      ]),
      _: 1
    }, 16, ["class"]));
  }
}), jf = Xi(
  "inline-flex items-center rounded-full font-semibold leading-tight transition-all duration-200 ease-in-out h-fit",
  {
    variants: {
      variant: {
        green: "bg-unraid-green-200 text-unraid-green-800",
        red: "bg-unraid-red text-white",
        gray: "bg-gray-200 text-gray-800",
        orange: "bg-orange text-white"
      },
      size: {
        sm: "text-sm px-2 py-1 gap-2",
        md: "text-base px-3 py-2 gap-2"
      }
    },
    defaultVariants: {
      variant: "gray",
      size: "sm"
    }
  }
), Ft = /* @__PURE__ */ We({
  __name: "Badge",
  props: {
    variant: { default: "gray", type: null },
    size: { default: "sm", type: null },
    class: { default: "", type: String }
  },
  setup(e) {
    const t = e, s = ye(() => jf({ variant: t.variant, size: t.size }));
    return (n, o) => (C(), R("span", {
      class: ot([s.value, t.class])
    }, [
      os(n.$slots, "default")
    ], 2));
  }
});
typeof WorkerGlobalScope < "u" && globalThis instanceof WorkerGlobalScope;
const Nf = (e) => typeof e < "u";
function Lf(e) {
  return JSON.parse(JSON.stringify(e));
}
// @__NO_SIDE_EFFECTS__
function ia(e, t, s, n = {}) {
  var o, l, i;
  const {
    clone: a = !1,
    passive: u = !1,
    eventName: h,
    deep: g = !1,
    defaultValue: x,
    shouldEmit: A
  } = n, k = rs(), O = s || (k == null ? void 0 : k.emit) || ((o = k == null ? void 0 : k.$emit) == null ? void 0 : o.bind(k)) || ((i = (l = k == null ? void 0 : k.proxy) == null ? void 0 : l.$emit) == null ? void 0 : i.bind(k == null ? void 0 : k.proxy));
  let v = h;
  v = v || `update:${t.toString()}`;
  const F = (K) => a ? typeof a == "function" ? a(K) : Lf(K) : K, z = () => Nf(e[t]) ? F(e[t]) : x, D = (K) => {
    A ? A(K) && O(v, K) : O(v, K);
  };
  if (u) {
    const K = z(), U = /* @__PURE__ */ N(K);
    let Z = !1;
    return bt(
      () => e[t],
      (Oe) => {
        Z || (Z = !0, U.value = F(Oe), Pn(() => Z = !1));
      }
    ), bt(
      U,
      (Oe) => {
        !Z && (Oe !== e[t] || g) && D(Oe);
      },
      { deep: g }
    ), U;
  } else
    return ye({
      get() {
        return z();
      },
      set(K) {
        D(K);
      }
    });
}
const Uf = ["type", "placeholder"], he = /* @__PURE__ */ We({
  __name: "Input",
  props: {
    defaultValue: { type: [String, Number] },
    modelValue: { type: [String, Number] },
    type: { type: String },
    placeholder: { type: String },
    class: { type: String }
  },
  emits: ["update:modelValue"],
  setup(e, { emit: t }) {
    const s = e, o = /* @__PURE__ */ ia(s, "modelValue", t, {
      passive: !0,
      defaultValue: s.defaultValue
    });
    return (l, i) => vr((C(), R("input", {
      "onUpdate:modelValue": i[0] || (i[0] = (a) => /* @__PURE__ */ Pe(o) ? o.value = a : null),
      type: e.type ?? "text",
      placeholder: e.placeholder,
      class: ot(
        m(wo)(
          "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          s.class
        )
      )
    }, null, 10, Uf)), [
      [kc, m(o)]
    ]);
  }
}), Df = ["id", "disabled"], Cs = /* @__PURE__ */ We({
  __name: "Select",
  props: {
    modelValue: { type: String },
    class: { type: String },
    id: { type: String },
    disabled: { type: Boolean }
  },
  emits: ["update:modelValue"],
  setup(e, { emit: t }) {
    const s = e, o = /* @__PURE__ */ ia(s, "modelValue", t, { passive: !0 });
    return (l, i) => (C(), R("div", {
      class: ot(m(wo)("relative inline-block", s.class))
    }, [
      vr(f("select", {
        id: e.id,
        "onUpdate:modelValue": i[0] || (i[0] = (a) => /* @__PURE__ */ Pe(o) ? o.value = a : null),
        disabled: e.disabled,
        class: "border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full cursor-pointer appearance-none rounded-md border py-2 pr-8 pl-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
      }, [
        os(l.$slots, "default")
      ], 8, Df), [
        [Gi, m(o)]
      ]),
      i[1] || (i[1] = f("svg", {
        class: "text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2",
        width: "10",
        height: "6",
        viewBox: "0 0 10 6",
        fill: "none",
        "aria-hidden": "true"
      }, [
        f("path", {
          d: "M1 1L5 5L9 1",
          stroke: "currentColor",
          "stroke-width": "1.5",
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        })
      ], -1))
    ], 2));
  }
}), Bf = ["for"], oe = /* @__PURE__ */ We({
  __name: "Label",
  props: {
    for: { type: String },
    class: { type: String }
  },
  setup(e) {
    return (t, s) => (C(), R("label", {
      for: t.$props.for,
      class: ot(["text-sm leading-none font-medium", t.$props.class])
    }, [
      os(t.$slots, "default")
    ], 10, Bf));
  }
}), Ff = { class: "inline_help" }, le = /* @__PURE__ */ We({
  __name: "HelpText",
  setup(e) {
    return (t, s) => (C(), R("blockquote", Ff, [
      os(t.$slots, "default")
    ]));
  }
}), Hf = {
  role: "tablist",
  "aria-label": "Incus settings sections",
  class: "mb-6 flex gap-1 border-b border-border"
}, zf = ["id", "aria-selected", "aria-controls", "tabindex", "onClick", "onKeydown"], Wf = /* @__PURE__ */ We({
  __name: "TabNavigation",
  props: {
    modelValue: { required: !0 },
    modelModifiers: {}
  },
  emits: ["update:modelValue"],
  setup(e) {
    const t = yd(e, "modelValue"), s = [
      { id: "builder", label: "Builder" },
      { id: "jails", label: "Containers" },
      { id: "config", label: "Config" }
    ];
    function n(o, l) {
      var u;
      const i = s.findIndex((h) => h.id === l);
      let a = null;
      o.key === "ArrowRight" ? a = (i + 1) % s.length : o.key === "ArrowLeft" ? a = (i - 1 + s.length) % s.length : o.key === "Home" ? a = 0 : o.key === "End" && (a = s.length - 1), a !== null && (o.preventDefault(), t.value = s[a].id, (u = document.getElementById(`incus-tab-${s[a].id}`)) == null || u.focus());
    }
    return (o, l) => (C(), R("div", Hf, [
      (C(), R(ue, null, Qe(s, (i) => f("button", {
        id: `incus-tab-${i.id}`,
        key: i.id,
        role: "tab",
        type: "button",
        "aria-selected": t.value === i.id,
        "aria-controls": `incus-panel-${i.id}`,
        tabindex: t.value === i.id ? 0 : -1,
        class: ot(["-mb-px cursor-pointer border-b-[3px] px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition-colors", t.value === i.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"]),
        onClick: (a) => t.value = i.id,
        onKeydown: (a) => n(a, i.id)
      }, M(i.label), 43, zf)), 64))
    ]));
  }
});
class aa extends Error {
  constructor(t, s) {
    super(t), this.errors = s;
  }
}
let Ul = null;
function qf() {
  return window.csrf_token ? Promise.resolve() : (Ul ?? (Ul = new Promise((e) => {
    const t = Date.now() + 2e3, s = () => {
      window.csrf_token || Date.now() >= t ? e() : setTimeout(s, 20);
    };
    s();
  })), Ul);
}
async function Dl(e, t) {
  var o, l;
  const s = await fetch("/graphql", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": window.csrf_token ?? ""
    },
    body: JSON.stringify({ query: e, variables: t })
  });
  if (!s.ok)
    throw new Error(`GraphQL request failed: HTTP ${s.status}`);
  const n = await s.json();
  if ((o = n.errors) != null && o.length)
    throw new aa(((l = n.errors[0]) == null ? void 0 : l.message) ?? "GraphQL error", n.errors);
  return n.data;
}
const Kf = (e) => new Promise((t) => setTimeout(t, e));
function Gf(e) {
  const t = e.replace(/^\s*(?:#[^\n]*\n\s*)*/, "");
  return t.startsWith("query") || t.startsWith("{");
}
async function pe(e, t) {
  await qf();
  try {
    return await Dl(e, t);
  } catch (s) {
    if (s instanceof aa || !Gf(e)) throw s;
    return await Kf(300), Dl(e, t);
  }
}
const Ko = 2e3;
function Kn(e, t, s = {}) {
  let n = !1, o = null, l = null;
  const i = new AbortController(), a = typeof document > "u" ? null : document, u = {
    signal: i.signal,
    isActive: () => !n && !i.signal.aborted
  }, h = () => {
    n || (l = setTimeout(() => void g(), t));
  }, g = async () => {
    if (!n) {
      if (a != null && a.hidden) {
        h();
        return;
      }
      return o || (o = e(u).catch((A) => {
        var k;
        u.isActive() && ((k = s.onError) == null || k.call(s, A));
      }).finally(() => {
        o = null, h();
      }), o);
    }
  };
  s.immediate ? g() : h();
  const x = () => {
    !(a != null && a.hidden) && !n && !o && (l && clearTimeout(l), l = null, g());
  };
  return a == null || a.addEventListener("visibilitychange", x), {
    stop() {
      n = !0, i.abort(), l && clearTimeout(l), l = null, a == null || a.removeEventListener("visibilitychange", x);
    },
    trigger: g
  };
}
function Jf(e, t) {
  const { tsAuthKeyConfigured: s, ...n } = e, o = { ...n, jailIpv6: "none" };
  return t.clear ? { ...o, tsAuthKey: "" } : t.replacement ? { ...o, tsAuthKey: t.replacement } : o;
}
function Yf(e, t) {
  const s = /* @__PURE__ */ Gt(/* @__PURE__ */ new Map()), n = /* @__PURE__ */ Gt(/* @__PURE__ */ new Map()), o = /* @__PURE__ */ N([]), l = /* @__PURE__ */ Gt(/* @__PURE__ */ new Map()), i = 30, a = ye(() => e.value.filter((q) => q.status.toLowerCase() === "running")), u = ye(() => e.value.length - a.value.length), h = ye(() => a.value.reduce((q, te) => q + Number(te.memoryUsageBytes ?? 0), 0)), g = ye(() => a.value.reduce((q, te) => q + BigInt(te.cpuUsageNs ?? "0"), 0n));
  function x(q) {
    if (q == null) return "—";
    const te = Math.floor(q / 1e9), je = Math.floor(te / 3600), ke = Math.floor(te % 3600 / 60), Re = te % 60;
    return je > 0 ? `${je}h ${ke}m ${Re}s` : ke > 0 ? `${ke}m ${Re}s` : `${Re}s`;
  }
  function A(q) {
    if (q == null) return "—";
    if (q === 0) return "0 B";
    const te = ["B", "KiB", "MiB", "GiB", "TiB"], je = Math.min(Math.floor(Math.log(q) / Math.log(1024)), te.length - 1), ke = q / 1024 ** je;
    return `${ke >= 10 || je === 0 ? Math.round(ke) : ke.toFixed(1)} ${te[je]}`;
  }
  function k(q) {
    if (q.memoryUsageBytes == null) return "—";
    const te = A(Number(q.memoryUsageBytes));
    return q.memoryTotalBytes ? `${te} / ${A(Number(q.memoryTotalBytes))}` : te;
  }
  function O(q) {
    return !q.memoryTotalBytes || q.memoryUsageBytes == null ? null : Math.min(100, Math.round(Number(q.memoryUsageBytes) / Number(q.memoryTotalBytes) * 100));
  }
  function v() {
    const q = t().trim();
    if (!/^\d+$/.test(q)) return null;
    const te = Number(q);
    return te > 0 ? te : null;
  }
  function F() {
    const q = Date.now();
    let te = 0, je = !1, ke = 0, Re = 0;
    for (const ge of e.value) {
      if (ge.cpuUsageNs == null) {
        s.delete(ge.name), l.delete(ge.name);
        continue;
      }
      const Je = BigInt(ge.cpuUsageNs), dt = s.get(ge.name);
      if (dt) {
        const Ce = Je - dt.cpuUsageNs, de = q - dt.atMs;
        if (Ce >= 0n && de > 0) {
          const ne = Number(Ce) / (de * 1e6) * 100;
          l.set(ge.name, ne);
          const Ae = O(ge), Me = n.get(ge.name) ?? [];
          Me.push({ atMs: q, cpuPct: ne, memPct: Ae }), Me.length > i && Me.shift(), n.set(ge.name, Me), ge.status.toLowerCase() === "running" && (te += ne, je = !0, Ae !== null && (ke += Ae, Re++));
        } else l.delete(ge.name);
      } else l.delete(ge.name);
      s.set(ge.name, { atMs: q, cpuUsageNs: Je });
    }
    const ae = new Set(e.value.map((ge) => ge.name));
    for (const ge of [s, n, l])
      for (const Je of Array.from(ge.keys())) ae.has(Je) || ge.delete(Je);
    je && (o.value.push({ atMs: q, cpuPct: te, memPct: Re ? ke / Re : null }), o.value.length > i && o.value.shift());
  }
  return {
    runningJails: a,
    stoppedJailsCount: u,
    totalMemoryUsageBytes: h,
    totalCpuUsageNs: g,
    fleetHistory: o,
    formatDuration: x,
    formatBytes: A,
    formatMemory: k,
    memoryFillPct: O,
    updateCpuSamplesAndHistory: F,
    cpuRateLabel: (q) => l.has(q.name) ? `${l.get(q.name).toFixed(l.get(q.name) < 10 ? 1 : 0)}%` : "—",
    cpuRatePct: (q) => {
      const te = l.get(q.name);
      return te === void 0 ? null : Math.min(100, Math.max(0, Math.round(v() ? te / v() : te)));
    },
    cpuRateSuffix: () => v() ? `of ${v()} core${v() === 1 ? "" : "s"}` : "of 1 core",
    jailCpuHistory: (q) => n.get(q) ?? [],
    totalCpuRateLabel: () => o.value.length ? `${o.value.at(-1).cpuPct.toFixed(o.value.at(-1).cpuPct < 10 ? 1 : 0)}%` : "—",
    sparklinePoints: (q, te, je = 80, ke = 24) => q.map((Re, ae) => Re[te] === null ? null : `${(ae * (je / Math.max(1, q.length - 1))).toFixed(1)},${(ke - Math.min(100, Math.max(0, Re[te])) / 100 * ke).toFixed(1)}`).filter(Boolean).join(" ")
  };
}
const Qf = `query { incusConfig {
  enabled stateDir storageDriver storageSource storagePoolName jailBridge jailSubnet jailNat jailIpv6
  aclName aclBlock aclAllow aclDefaultEgress aclDefaultIngress jailProfile jailImage jailNesting jailCpu jailMemory
  jailWorkspaceRoot jailAgentUid jailAgentGid jailBindMounts tsAuthKeyConfigured dashboardWidgetEnable
} }`, Zf = "query { incusHealthy jails { name status ipv4 cpuUsageNs memoryUsageBytes memoryTotalBytes } }", Bl = "mutation($input: IncusConfigInput!) { updateIncusConfig(input: $input) { enabled } }", Xf = "mutation($name: String!, $action: JailAction!) { setJailState(name: $name, action: $action) }", ep = "mutation($name: String!) { deleteJail(name: $name) }", tp = "mutation($name: String!, $image: String, $allowSudo: Boolean) { launchJail(name: $name, image: $image, allowSudo: $allowSudo) }", sp = "query($name: String!) { jailDetail(name: $name) { name profiles imageOs imageRelease imageDescription storagePool networkBridge cpuLimit cpuLimitIsOverride memoryLimit memoryLimitIsOverride workspaceHostPath workspaceIsOverride sudoEnabled } }", np = "mutation($name: String!) { grantJailSudo(name: $name) }", op = "mutation($name: String!, $command: String!) { startPrivilegedCommand(name: $name, command: $command) }", rp = "query($id: String!) { privilegedCommandStatus(id: $id) { id command status exitCode stdout stderr message } }", lp = "mutation($name: String!, $hostPath: String!) { setJailWorkspace(name: $name, hostPath: $hostPath) }", ip = "mutation($name: String!) { clearJailWorkspace(name: $name) }", Go = "mutation($name: String!, $cpu: String, $memory: String) { setJailLimits(name: $name, cpu: $cpu, memory: $memory) }", ap = "mutation($distro: String!, $release: String!, $packages: [String!]!, $alias: String!, $basedOn: String, $postInstallCommands: [String!]) { buildJailImage(distro: $distro, release: $release, packages: $packages, alias: $alias, basedOn: $basedOn, postInstallCommands: $postInstallCommands) }", up = "mutation($alias: String!) { deleteJailImage(alias: $alias) }", dp = "query($query: String!, $distro: String, $release: String) { searchAllPackages(query: $query, distro: $distro, release: $release) { results { ecosystem name description version } errors { ecosystem message } } }", cp = "query($buildId: String!) { jailImageBuildStatus(buildId: $buildId) { id status alias distro release packages logTail error } }", fp = "query { builderPresets { name distro release packages } }", pp = "mutation($input: BuilderPresetInput!) { saveBuilderPreset(input: $input) { name } }", mp = "mutation($name: String!) { deleteBuilderPreset(name: $name) }", gp = "query { jailImages { alias distro release packages isMaster basedOn createdAt } }", Jo = "mutation($alias: String!, $isMaster: Boolean!) { setMasterImage(alias: $alias, isMaster: $isMaster) { alias isMaster } }", hp = "mutation { pruneStaleImageRecords }", bp = "mutation { deleteStoppedJails }", vp = "mutation($name: String!) { migrateJailWorkspace(name: $name) }", yp = "mutation($name: String!, $formula: String!) { installHomebrewFormula(name: $name, formula: $formula) }", xp = "query($id: String!) { homebrewInstallStatus(id: $id) { id formula status message } }";
function _p(e) {
  const t = /* @__PURE__ */ N(null), s = /* @__PURE__ */ N(null), n = /* @__PURE__ */ N(!1), o = /* @__PURE__ */ N(""), l = /* @__PURE__ */ N(""), i = /* @__PURE__ */ N(""), a = /* @__PURE__ */ N("");
  let u = 0;
  async function h(x) {
    if (e(), t.value === x) {
      ++u, t.value = null, s.value = null, n.value = !1;
      return;
    }
    t.value = x, await g(x);
  }
  async function g(x) {
    const A = ++u;
    n.value = !0, o.value = "";
    try {
      const k = await pe(sp, { name: x });
      if (A !== u || t.value !== x) return;
      s.value = k.jailDetail, l.value = k.jailDetail.cpuLimit ?? "", i.value = k.jailDetail.memoryLimit ?? "", a.value = k.jailDetail.workspaceHostPath ?? "";
    } catch (k) {
      if (A !== u || t.value !== x) return;
      o.value = k instanceof Error ? k.message : String(k);
    } finally {
      A === u && (n.value = !1);
    }
  }
  return {
    detailsJailName: t,
    jailDetail: s,
    detailLoading: n,
    detailError: o,
    editCpuLimit: l,
    editMemoryLimit: i,
    editWorkspacePath: a,
    toggleJailDetails: h,
    loadJailDetail: g
  };
}
const wp = { class: "unapi w-full max-w-4xl text-foreground xl:max-w-6xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1880px] min-[2560px]:max-w-[2200px]" }, kp = {
  key: 0,
  class: "py-8 text-muted-foreground"
}, Sp = {
  key: 0,
  role: "alert",
  class: "mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
}, Cp = { class: "mb-6 flex items-center gap-3 border-b border-border pb-4" }, Ap = { class: "ml-auto flex items-center gap-3" }, Ep = {
  key: 1,
  id: "incus-panel-builder",
  role: "tabpanel",
  "aria-labelledby": "incus-tab-builder",
  tabindex: "0"
}, Ip = { class: "grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]" }, Tp = { class: "mb-6 rounded-lg border border-border bg-card p-4 xl:mb-0" }, Pp = {
  key: 0,
  class: "mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Rp = {
  key: 1,
  class: "text-sm text-muted-foreground"
}, Mp = {
  key: 2,
  class: "mb-3 flex flex-wrap gap-2"
}, $p = ["onClick"], Vp = { class: "font-mono text-muted-foreground" }, Op = ["onClick"], jp = { class: "flex gap-2" }, Np = { class: "mt-5 border-t border-border pt-4" }, Lp = { class: "mb-2 flex items-center justify-between gap-3" }, Up = {
  key: 0,
  class: "mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Dp = {
  key: 1,
  class: "mb-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs"
}, Bp = {
  key: 2,
  class: "text-sm text-muted-foreground"
}, Fp = {
  key: 3,
  class: "flex flex-col gap-2"
}, Hp = { class: "min-w-0 flex-1" }, zp = { class: "flex items-center gap-2" }, Wp = { class: "font-mono text-[13px] font-medium" }, qp = { class: "text-xs text-muted-foreground" }, Kp = { class: "mt-0.5 truncate text-xs text-muted-foreground" }, Gp = { class: "mt-5 border-t border-border pt-4" }, Jp = ["aria-expanded"], Yp = {
  key: 0,
  id: "config-import-panel",
  class: "mt-3 flex flex-col gap-4"
}, Qp = {
  key: 0,
  class: "mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Zp = {
  key: 1,
  class: "mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs"
}, Xp = {
  key: 0,
  class: "text-foreground"
}, em = {
  key: 1,
  class: "mt-1"
}, tm = { class: "font-mono" }, sm = {
  key: 2,
  class: "mt-1"
}, nm = {
  key: 3,
  class: "mt-1"
}, om = { class: "ml-4 list-disc text-muted-foreground" }, rm = { class: "border-t border-border pt-4" }, lm = { class: "flex gap-2" }, im = {
  key: 0,
  class: "mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, am = {
  key: 1,
  class: "mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs"
}, um = { class: "font-mono" }, dm = { class: "border-t border-border pt-4" }, cm = { class: "flex flex-wrap gap-2" }, fm = { class: "mb-6 rounded-lg border border-border bg-card p-4" }, pm = {
  key: 0,
  class: "mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
}, mm = {
  key: 1,
  class: "mb-4 flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs"
}, gm = { class: "font-mono font-medium" }, hm = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, bm = { class: "flex justify-self-end gap-2" }, vm = ["value"], ym = { class: "flex justify-self-end gap-2" }, xm = ["value"], _m = { class: "mt-5 border-t border-border pt-4" }, wm = {
  key: 0,
  class: "mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, km = {
  key: 1,
  class: "mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
}, Sm = {
  key: 2,
  class: "mt-2 text-xs text-muted-foreground"
}, Cm = {
  key: 3,
  class: "mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto"
}, Am = { class: "min-w-0 flex-1" }, Em = { class: "font-mono font-medium" }, Im = {
  key: 0,
  class: "ml-1.5 font-mono text-muted-foreground"
}, Tm = {
  key: 1,
  class: "truncate text-muted-foreground"
}, Pm = {
  key: 1,
  class: "shrink-0 text-muted-foreground"
}, Rm = {
  key: 4,
  class: "mt-2 text-xs text-muted-foreground"
}, Mm = {
  key: 5,
  class: "mt-3"
}, $m = { class: "flex flex-wrap gap-1.5" }, Vm = ["aria-label", "onClick"], Om = {
  key: 6,
  class: "mt-3"
}, jm = { class: "flex flex-col gap-1" }, Nm = { class: "flex-1" }, Lm = ["aria-label", "onClick"], Um = { class: "mt-4" }, Dm = { class: "mt-4 flex justify-end" }, Bm = { class: "rounded-lg border border-border bg-card p-4" }, Fm = {
  key: 0,
  class: "flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2.5"
}, Hm = {
  key: 1,
  class: "flex flex-col gap-4"
}, zm = { class: "mb-2 flex items-center justify-between gap-3" }, Wm = { class: "flex items-center gap-2" }, qm = { class: "text-sm font-medium" }, Km = { class: "text-xs text-muted-foreground" }, Gm = {
  key: 0,
  class: "mb-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Jm = { class: "flex items-center gap-2 rounded-t-md border border-b-0 border-neutral-800 bg-neutral-950 px-3 py-1.5" }, Ym = { class: "font-mono text-[11px] text-neutral-400" }, Qm = { class: "max-h-48 overflow-auto rounded-b-md border border-neutral-800 bg-neutral-950 p-2.5 text-xs font-mono whitespace-pre-wrap text-neutral-200" }, Zm = {
  key: 2,
  id: "incus-panel-jails",
  role: "tabpanel",
  "aria-labelledby": "incus-tab-jails",
  tabindex: "0"
}, Xm = { class: "mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" }, eg = { class: "rounded-lg border border-border bg-card p-3" }, tg = { class: "mt-1 font-mono text-xl" }, sg = { class: "rounded-lg border border-border bg-card p-3" }, ng = { class: "mt-1 font-mono text-xl" }, og = { class: "rounded-lg border border-border bg-card p-3" }, rg = { class: "mt-1 font-mono text-xl" }, lg = { class: "rounded-lg border border-border bg-card p-3" }, ig = { class: "mt-1.5" }, ag = { class: "rounded-lg border border-border bg-card p-3" }, ug = { class: "mt-1 font-mono text-xl" }, dg = { class: "rounded-lg border border-border bg-card p-3" }, cg = { class: "mt-1 font-mono text-xl" }, fg = {
  key: 0,
  viewBox: "0 0 80 24",
  width: "80",
  height: "24",
  class: "mt-1 text-primary",
  preserveAspectRatio: "none"
}, pg = ["points"], mg = { class: "mb-6 grid grid-cols-1 items-start gap-4 xl:grid-cols-2" }, gg = { class: "rounded-lg border border-border bg-card p-4" }, hg = { class: "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3" }, bg = { class: "mt-1 font-mono text-sm" }, vg = { class: "mt-1 font-mono text-sm" }, yg = { class: "mt-1 font-mono text-sm" }, xg = { class: "mt-1 font-mono text-sm" }, _g = { class: "mt-1 font-mono text-sm" }, wg = { class: "rounded-lg border border-border bg-card p-4" }, kg = { class: "flex flex-col gap-3 sm:flex-row sm:items-end" }, Sg = { class: "flex-1" }, Cg = { class: "flex-1" }, Ag = { value: "" }, Eg = ["value"], Ig = {
  key: 0,
  class: "mt-2 text-xs text-destructive"
}, Tg = { class: "mt-3 flex items-center gap-2.5" }, Pg = { class: "rounded-lg border border-border bg-card p-4" }, Rg = { class: "mb-4 flex items-center justify-between gap-3" }, Mg = {
  key: 0,
  class: "text-sm text-muted-foreground"
}, $g = { class: "mb-3 text-xs text-muted-foreground" }, Vg = { class: "grid grid-cols-1 gap-4 xl:grid-cols-2" }, Og = { class: "flex flex-wrap items-center justify-between gap-2" }, jg = { class: "flex min-w-0 items-center gap-2" }, Ng = { class: "truncate font-mono text-[13px] font-medium" }, Lg = {
  key: 0,
  class: "shrink-0 inline-flex items-center rounded-full bg-unraid-green-200 px-1.5 py-0.5 text-[10px] font-semibold text-unraid-green-800",
  title: "This container's IPv4 falls within the configured subnet."
}, Ug = { class: "shrink-0 font-mono text-xs text-muted-foreground" }, Dg = { class: "mt-3 grid grid-cols-2 gap-3" }, Bg = ["title"], Fg = { class: "mt-1 flex items-center gap-2" }, Hg = { class: "h-1.5 w-16 overflow-hidden rounded-full bg-muted" }, zg = { class: "font-mono text-[13px]" }, Wg = {
  key: 0,
  viewBox: "0 0 80 24",
  width: "60",
  height: "18",
  class: "text-primary",
  preserveAspectRatio: "none"
}, qg = ["points"], Kg = { class: "mt-1 flex items-center gap-2" }, Gg = { class: "font-mono text-[13px]" }, Jg = {
  key: 0,
  viewBox: "0 0 80 24",
  width: "60",
  height: "18",
  class: "text-primary",
  preserveAspectRatio: "none"
}, Yg = ["points"], Qg = {
  key: 0,
  class: "mt-1 h-1 w-20 overflow-hidden rounded-full bg-muted"
}, Zg = { class: "mt-3 flex flex-wrap gap-2" }, Xg = {
  key: 0,
  class: "mt-3 rounded-md border border-border bg-muted/30 p-3"
}, eh = {
  key: 0,
  class: "text-xs text-muted-foreground"
}, th = { class: "grid grid-cols-2 gap-3 sm:grid-cols-4" }, sh = { class: "mt-1 font-mono text-xs" }, nh = { class: "mt-1 font-mono text-xs" }, oh = { class: "mt-1 font-mono text-xs" }, rh = { class: "mt-1 font-mono text-xs" }, lh = { class: "mt-4 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2" }, ih = { class: "flex flex-wrap items-end gap-2" }, ah = { class: "flex gap-1.5" }, uh = { class: "flex gap-1.5" }, dh = { class: "flex gap-2" }, ch = {
  key: 0,
  class: "mt-3 flex flex-wrap items-center gap-3 rounded-md border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs"
}, fh = {
  key: 1,
  class: "mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, ph = { class: "mt-4 border-t border-border pt-3" }, mh = { class: "mb-1 flex items-center gap-1.5 text-xs font-medium" }, gh = { class: "mt-4 border-t border-border pt-3" }, hh = { class: "flex flex-wrap gap-2" }, bh = {
  key: 0,
  class: "mt-1.5 text-xs text-unraid-green-800"
}, vh = {
  key: 1,
  class: "mt-1.5 text-xs text-destructive"
}, yh = { class: "mt-4 border-t border-border pt-3" }, xh = { class: "flex flex-wrap gap-2" }, _h = {
  key: 0,
  class: "mt-2"
}, wh = {
  key: 0,
  class: "mt-1 max-h-40 overflow-auto rounded-md border border-neutral-800 bg-neutral-950 p-2 text-[11px] whitespace-pre-wrap text-neutral-200"
}, kh = {
  key: 3,
  id: "incus-panel-config",
  role: "tabpanel",
  "aria-labelledby": "incus-tab-config",
  tabindex: "0"
}, Sh = { class: "columns-1 gap-4 xl:columns-2" }, Ch = { class: "mb-4 break-inside-avoid rounded-lg border border-border bg-card p-4" }, Ah = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, Eh = { class: "mt-4 border-t border-border pt-4" }, Ih = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, Th = { class: "mb-4 break-inside-avoid rounded-lg border border-border bg-card p-4" }, Ph = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, Rh = { class: "mt-4 border-t border-border pt-4" }, Mh = {
  key: 0,
  class: "mb-2 flex flex-wrap gap-1.5"
}, $h = ["aria-label", "onClick"], Vh = { class: "flex gap-2" }, Oh = {
  key: 1,
  class: "mt-1.5 text-xs text-destructive"
}, jh = { class: "mt-4" }, Nh = {
  key: 0,
  class: "mb-2 flex flex-wrap gap-1.5"
}, Lh = ["aria-label", "onClick"], Uh = { class: "flex gap-2" }, Dh = {
  key: 1,
  class: "mt-1.5 text-xs text-destructive"
}, Bh = { class: "mt-4 border-t border-border pt-4" }, Fh = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, Hh = { class: "flex justify-self-end gap-2" }, zh = { class: "mb-4 break-inside-avoid rounded-lg border border-border bg-card p-4" }, Wh = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, qh = {
  key: 0,
  class: "col-span-2 -mt-2 text-xs text-destructive"
}, Kh = {
  key: 1,
  class: "col-span-2 -mt-2 text-xs text-destructive"
}, Gh = { class: "mt-4 border-t border-border pt-4" }, Jh = { class: "mb-8 flex justify-end" }, Yh = 5e3, Yo = "__other__", cs = "__other__", Qh = 400, Zh = /* @__PURE__ */ We({
  __name: "App",
  setup(e) {
    const t = /* @__PURE__ */ ed(() => import("./incus-settings-Terminal-DDk6hy6k.js")), s = /* @__PURE__ */ N("jails"), n = /* @__PURE__ */ N(!0), o = /* @__PURE__ */ N(!1), l = /* @__PURE__ */ N(null), i = /* @__PURE__ */ N(!1), a = /* @__PURE__ */ N([]), u = /* @__PURE__ */ N(""), h = ye(() => ma(u.value)), g = ye(() => Mr(v.jailCpu)), x = ye(() => $r(v.jailMemory)), A = /* @__PURE__ */ N(""), k = /* @__PURE__ */ N(!1), O = /* @__PURE__ */ N(null), v = /* @__PURE__ */ Gt({
      enabled: !1,
      stateDir: "",
      storageDriver: "dir",
      storageSource: "",
      storagePoolName: "",
      jailBridge: "",
      jailSubnet: "",
      jailNat: !0,
      jailIpv6: "none",
      aclName: "",
      aclBlock: "",
      aclAllow: "",
      aclDefaultEgress: "allow",
      aclDefaultIngress: "drop",
      jailProfile: "",
      jailImage: "",
      jailNesting: !1,
      jailCpu: "",
      jailMemory: "",
      jailWorkspaceRoot: "",
      jailAgentUid: "",
      jailAgentGid: "",
      jailBindMounts: "",
      tsAuthKeyConfigured: !1,
      dashboardWidgetEnable: !0
    }), {
      runningJails: F,
      stoppedJailsCount: z,
      totalMemoryUsageBytes: D,
      totalCpuUsageNs: K,
      fleetHistory: U,
      formatDuration: Z,
      formatBytes: Oe,
      formatMemory: q,
      memoryFillPct: te,
      updateCpuSamplesAndHistory: je,
      cpuRateLabel: ke,
      cpuRatePct: Re,
      cpuRateSuffix: ae,
      jailCpuHistory: ge,
      totalCpuRateLabel: Je,
      sparklinePoints: dt
    } = Yf(a, () => v.jailCpu), Ce = ye(() => v.storageDriver === "zfs"), de = /* @__PURE__ */ N(!1), ne = /* @__PURE__ */ N(""), Ae = /* @__PURE__ */ N(!1);
    let Me = !1;
    async function Le() {
      const c = await pe(Qf);
      Me && (Object.assign(v, c.incusConfig), v.jailIpv6 = "none");
    }
    let tt = 0;
    async function mt() {
      const c = ++tt;
      try {
        const r = await pe(Zf);
        if (c !== tt) return;
        i.value = r.incusHealthy, a.value = r.jails, je();
      } catch {
        if (c !== tt) return;
        i.value = !1;
      }
    }
    _i(async () => {
      Me = !0;
      try {
        if (await Le(), !Me || (await mt(), !Me)) return;
        await Promise.all([Mo(), Un()]);
      } catch (c) {
        if (!Me) return;
        l.value = c instanceof Error ? c.message : String(c);
      } finally {
        Me && (n.value = !1);
      }
      Me && s.value === "jails" && Nr();
    }), bt(s, (c) => {
      c === "jails" ? (mt(), Nr()) : Co();
    });
    async function ko() {
      o.value = !0, l.value = null;
      try {
        const c = Jf(v, {
          replacement: ne.value,
          clear: Ae.value
        });
        await pe(Bl, { input: c }), (Ae.value || ne.value) && (v.tsAuthKeyConfigured = !Ae.value, ne.value = "", Ae.value = !1), await mt();
      } catch (c) {
        l.value = c instanceof Error ? c.message : String(c);
      } finally {
        o.value = !1;
      }
    }
    async function Mn(c, r) {
      l.value = null;
      try {
        await pe(Xf, { name: c, action: r }), await mt();
      } catch (d) {
        l.value = d instanceof Error ? d.message : String(d);
      }
    }
    async function ls(c) {
      if (confirm(`Delete container "${c}"? This cannot be undone.`)) {
        l.value = null;
        try {
          await pe(ep, { name: c }), await mt();
        } catch (r) {
          l.value = r instanceof Error ? r.message : String(r);
        }
      }
    }
    const jt = /* @__PURE__ */ N(!1);
    async function Ls() {
      if (confirm("Delete every stopped container? Running containers are never touched. This cannot be undone.")) {
        jt.value = !0, l.value = null;
        try {
          (await pe(bp)).deleteStoppedJails.length === 0 && (l.value = "No stopped containers to delete."), await mt();
        } catch (c) {
          l.value = c instanceof Error ? c.message : String(c);
        } finally {
          jt.value = !1;
        }
      }
    }
    async function $n() {
      if (!(!u.value.trim() || h.value)) {
        l.value = null;
        try {
          await pe(tp, {
            name: u.value.trim(),
            image: A.value || null,
            allowSudo: k.value
          }), u.value = "", k.value = !1, await mt();
        } catch (c) {
          l.value = c instanceof Error ? c.message : String(c);
        }
      }
    }
    const Ue = /* @__PURE__ */ N(!1), {
      detailsJailName: ce,
      jailDetail: p,
      detailLoading: b,
      detailError: w,
      editCpuLimit: P,
      editMemoryLimit: I,
      editWorkspacePath: E,
      toggleJailDetails: L,
      loadJailDetail: V
    } = _p(() => {
      yt(), we.value = !1, Ds(), kt.value = !1, ie.value = "", $e.value = "", He.value = "", Nt.value = "", St.value = null;
    });
    async function j() {
      if (!ce.value) return;
      const c = Mr(P.value);
      if (c) {
        w.value = c;
        return;
      }
      Ue.value = !0, w.value = "";
      try {
        await pe(Go, { name: ce.value, cpu: P.value.trim() }), await V(ce.value);
      } catch (r) {
        w.value = r instanceof Error ? r.message : String(r);
      } finally {
        Ue.value = !1;
      }
    }
    async function T() {
      if (!ce.value) return;
      const c = $r(I.value);
      if (c) {
        w.value = c;
        return;
      }
      Ue.value = !0, w.value = "";
      try {
        await pe(Go, { name: ce.value, memory: I.value.trim() }), await V(ce.value);
      } catch (r) {
        w.value = r instanceof Error ? r.message : String(r);
      } finally {
        Ue.value = !1;
      }
    }
    async function Y() {
      if (ce.value) {
        P.value = "", I.value = "", Ue.value = !0, w.value = "";
        try {
          await pe(Go, { name: ce.value, cpu: "", memory: "" }), await V(ce.value);
        } catch (c) {
          w.value = c instanceof Error ? c.message : String(c);
        } finally {
          Ue.value = !1;
        }
      }
    }
    async function B() {
      if (!(!ce.value || !E.value.trim())) {
        Ue.value = !0, w.value = "";
        try {
          await pe(lp, {
            name: ce.value,
            hostPath: E.value.trim()
          }), await V(ce.value);
        } catch (c) {
          w.value = c instanceof Error ? c.message : String(c);
        } finally {
          Ue.value = !1;
        }
      }
    }
    async function G() {
      if (ce.value) {
        Ue.value = !0, w.value = "";
        try {
          await pe(ip, { name: ce.value }), await V(ce.value);
        } catch (c) {
          w.value = c instanceof Error ? c.message : String(c);
        } finally {
          Ue.value = !1;
        }
      }
    }
    function Q(c) {
      var r;
      return !c.workspaceIsOverride && !!((r = c.workspaceHostPath) != null && r.endsWith("/default-workspace"));
    }
    const re = /* @__PURE__ */ N(!1);
    async function _e() {
      if (ce.value) {
        re.value = !0, w.value = "";
        try {
          await pe(vp, { name: ce.value }), await V(ce.value);
        } catch (c) {
          w.value = c instanceof Error ? c.message : String(c);
        } finally {
          re.value = !1;
        }
      }
    }
    const ie = /* @__PURE__ */ N(""), we = /* @__PURE__ */ N(!1), $e = /* @__PURE__ */ N(""), He = /* @__PURE__ */ N("");
    let st = null;
    function yt() {
      st !== null && (st.stop(), st = null);
    }
    async function Us() {
      if (!ce.value || !ie.value.trim()) return;
      const c = ce.value;
      yt(), we.value = !0, $e.value = "", He.value = "";
      try {
        const d = (await pe(yp, {
          name: c,
          formula: ie.value.trim()
        })).installHomebrewFormula;
        st = Kn(async ($) => {
          try {
            const H = await pe(
              xp,
              { id: d }
            );
            if (!$.isActive() || ce.value !== c) return;
            const ee = H.homebrewInstallStatus;
            if (!ee || ee.status === "running") return;
            yt(), we.value = !1, ee.status === "success" ? ($e.value = ee.message, ie.value = "") : He.value = ee.message;
          } catch (H) {
            if (!$.isActive() || ce.value !== c) return;
            yt(), we.value = !1, He.value = H instanceof Error ? H.message : String(H);
          }
        }, Ko);
      } catch (r) {
        He.value = r instanceof Error ? r.message : String(r), we.value = !1;
      }
    }
    const ze = /* @__PURE__ */ N(!1);
    async function gt() {
      if (ce.value) {
        ze.value = !0, w.value = "";
        try {
          await pe(np, { name: ce.value }), await V(ce.value);
        } catch (c) {
          w.value = c instanceof Error ? c.message : String(c);
        } finally {
          ze.value = !1;
        }
      }
    }
    const Nt = /* @__PURE__ */ N(""), kt = /* @__PURE__ */ N(!1), St = /* @__PURE__ */ N(null);
    let Vn = null;
    function Ds() {
      Vn !== null && (Vn.stop(), Vn = null);
    }
    async function Pr() {
      if (!(!ce.value || !Nt.value.trim())) {
        Ds(), kt.value = !0, St.value = null, w.value = "";
        try {
          const r = (await pe(op, {
            name: ce.value,
            command: Nt.value.trim()
          })).startPrivilegedCommand, d = ce.value;
          Vn = Kn(async ($) => {
            try {
              const H = await pe(
                rp,
                { id: r }
              );
              if (!$.isActive() || ce.value !== d) return;
              const ee = H.privilegedCommandStatus;
              if (!ee || ee.status === "running") return;
              Ds(), kt.value = !1, St.value = ee;
            } catch (H) {
              if (!$.isActive() || ce.value !== d) return;
              Ds(), kt.value = !1, w.value = H instanceof Error ? H.message : String(H);
            }
          }, Ko);
        } catch (c) {
          w.value = c instanceof Error ? c.message : String(c), kt.value = !1;
        }
      }
    }
    function ua(c) {
      const r = c.toLowerCase();
      return r === "running" ? "green" : r === "stopped" ? "gray" : "orange";
    }
    function So(c) {
      return c.split(",").map((r) => r.trim()).filter((r) => r.length > 0);
    }
    function da() {
      return So(v.aclBlock).length;
    }
    const Rr = /^[0-9a-fA-F:.]+\/\d{1,3}$/, ca = /^\d+(-\d+)?(,\d+(-\d+)?)*$/, fa = /^\d+(\.\d+)?(B|KB|MB|GB|TB|PB|KiB|MiB|GiB|TiB|PiB)?$/i, pa = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    function Mr(c) {
      return c.trim() ? ca.test(c.trim()) ? "" : `"${c}" doesn't look like a CPU limit — expected a core count (e.g. 2) or a set/range (e.g. 0-3).` : "";
    }
    function $r(c) {
      return c.trim() ? fa.test(c.trim()) ? "" : `"${c}" doesn't look like a memory limit — expected a byte count with an optional unit (e.g. 4GiB).` : "";
    }
    function ma(c) {
      return c.trim() ? pa.test(c.trim()) ? "" : `"${c}" isn't a valid container name — letters, digits, and hyphens only, can't start or end with a hyphen.` : "";
    }
    const Bs = ye(() => So(v.aclBlock)), Fs = ye(() => So(v.aclAllow)), Hs = /* @__PURE__ */ N(""), zs = /* @__PURE__ */ N(""), Ws = /* @__PURE__ */ N(""), qs = /* @__PURE__ */ N("");
    function Vr() {
      const c = Hs.value.trim();
      if (Ws.value = "", !!c) {
        if (!Rr.test(c)) {
          Ws.value = `"${c}" doesn't look like a CIDR — expected e.g. 10.0.0.0/8 or fd00::/8.`;
          return;
        }
        if (Bs.value.includes(c)) {
          Ws.value = `${c} is already in the list.`;
          return;
        }
        v.aclBlock = [...Bs.value, c].join(","), Hs.value = "";
      }
    }
    function ga(c) {
      v.aclBlock = Bs.value.filter((r) => r !== c).join(",");
    }
    function Or() {
      const c = zs.value.trim();
      if (qs.value = "", !!c) {
        if (!Rr.test(c)) {
          qs.value = `"${c}" doesn't look like a CIDR — expected e.g. 100.64.0.0/10 or fd00::/8.`;
          return;
        }
        if (Fs.value.includes(c)) {
          qs.value = `${c} is already in the list.`;
          return;
        }
        v.aclAllow = [...Fs.value, c].join(","), zs.value = "";
      }
    }
    function ha(c) {
      v.aclAllow = Fs.value.filter((r) => r !== c).join(",");
    }
    function jr(c) {
      const r = c.split(".");
      if (r.length !== 4) return null;
      let d = 0;
      for (const $ of r) {
        if (!/^\d{1,3}$/.test($)) return null;
        const H = Number($);
        if (H < 0 || H > 255) return null;
        d = d << 8 | H;
      }
      return d >>> 0;
    }
    function ba(c, r) {
      const [d, $] = r.split("/");
      if (!d || $ === void 0) return !1;
      const H = Number($);
      if (!Number.isInteger(H) || H < 0 || H > 32) return !1;
      const ee = jr(c), Fe = jr(d);
      if (ee === null || Fe === null) return !1;
      if (H === 0) return !0;
      const Ye = 4294967295 << 32 - H >>> 0;
      return (ee & Ye) === (Fe & Ye);
    }
    function va(c) {
      return !c.ipv4 || !v.jailSubnet || c.status.toLowerCase() !== "running" ? !1 : ba(c.ipv4, v.jailSubnet);
    }
    let On = null;
    function Nr() {
      Co(), On = Kn(mt, Yh);
    }
    function Co() {
      On !== null && (On.stop(), On = null);
    }
    const Lr = [
      { value: "debian", label: "Debian" },
      { value: "ubuntu", label: "Ubuntu" },
      { value: "alpinelinux", label: "Alpine Linux" },
      { value: "rockylinux", label: "Rocky Linux" },
      { value: "almalinux", label: "AlmaLinux" },
      { value: "fedora", label: "Fedora" }
    ], Lt = {
      debian: [
        { value: "bookworm", label: "Bookworm (12, oldstable)" },
        { value: "trixie", label: "Trixie (13, stable)" },
        { value: "sid", label: "Sid (unstable)" }
      ],
      ubuntu: [
        { value: "jammy", label: "Jammy (22.04 LTS)" },
        { value: "noble", label: "Noble (24.04 LTS)" },
        { value: "resolute", label: "Resolute (26.04 LTS)" }
      ],
      alpinelinux: [
        { value: "3.21", label: "3.21" },
        { value: "3.22", label: "3.22" },
        { value: "3.23", label: "3.23" },
        { value: "3.24", label: "3.24 (latest stable)" },
        { value: "edge", label: "Edge (rolling)" }
      ],
      rockylinux: [
        { value: "9", label: "9" },
        { value: "10", label: "10 (latest)" }
      ],
      almalinux: [
        { value: "9", label: "9" },
        { value: "10", label: "10 (latest)" }
      ],
      fedora: [
        { value: "41", label: "41" },
        { value: "44", label: "44 (latest)" }
      ]
    }, Ur = {
      debian: [
        { key: "build-tools", label: "Build tools", packages: ["build-essential"] },
        { key: "git", label: "Git", packages: ["git"] },
        { key: "python3", label: "Python 3", packages: ["python3", "python3-pip", "python3-venv"] },
        { key: "nodejs", label: "Node.js", packages: ["nodejs", "npm"] },
        { key: "curl", label: "curl", packages: ["curl"] },
        { key: "openssh-server", label: "OpenSSH server", packages: ["openssh-server"] },
        { key: "sudo", label: "sudo", packages: ["sudo"] },
        { key: "ca-certificates", label: "CA certificates", packages: ["ca-certificates"] }
      ],
      ubuntu: [
        { key: "build-tools", label: "Build tools", packages: ["build-essential"] },
        { key: "git", label: "Git", packages: ["git"] },
        { key: "python3", label: "Python 3", packages: ["python3", "python3-pip", "python3-venv"] },
        { key: "nodejs", label: "Node.js", packages: ["nodejs", "npm"] },
        { key: "curl", label: "curl", packages: ["curl"] },
        { key: "openssh-server", label: "OpenSSH server", packages: ["openssh-server"] },
        { key: "sudo", label: "sudo", packages: ["sudo"] },
        { key: "ca-certificates", label: "CA certificates", packages: ["ca-certificates"] }
      ],
      alpinelinux: [
        { key: "build-tools", label: "Build tools", packages: ["build-base"] },
        { key: "git", label: "Git", packages: ["git"] },
        { key: "python3", label: "Python 3", packages: ["python3", "py3-pip"] },
        { key: "curl", label: "curl", packages: ["curl"] },
        { key: "openssh-server", label: "OpenSSH server", packages: ["openssh"] },
        { key: "sudo", label: "sudo", packages: ["sudo"] },
        { key: "ca-certificates", label: "CA certificates", packages: ["ca-certificates"] }
      ],
      rockylinux: [
        { key: "build-tools", label: "Build tools", packages: ["gcc", "gcc-c++", "make"] },
        { key: "git", label: "Git", packages: ["git"] },
        { key: "python3", label: "Python 3", packages: ["python3", "python3-pip"] },
        { key: "curl", label: "curl", packages: ["curl"] },
        { key: "openssh-server", label: "OpenSSH server", packages: ["openssh-server"] },
        { key: "sudo", label: "sudo", packages: ["sudo"] },
        { key: "ca-certificates", label: "CA certificates", packages: ["ca-certificates"] }
      ],
      almalinux: [
        { key: "build-tools", label: "Build tools", packages: ["gcc", "gcc-c++", "make"] },
        { key: "git", label: "Git", packages: ["git"] },
        { key: "python3", label: "Python 3", packages: ["python3", "python3-pip"] },
        { key: "curl", label: "curl", packages: ["curl"] },
        { key: "openssh-server", label: "OpenSSH server", packages: ["openssh-server"] },
        { key: "sudo", label: "sudo", packages: ["sudo"] },
        { key: "ca-certificates", label: "CA certificates", packages: ["ca-certificates"] }
      ],
      fedora: [
        { key: "build-tools", label: "Build tools", packages: ["gcc", "gcc-c++", "make"] },
        { key: "git", label: "Git", packages: ["git"] },
        { key: "python3", label: "Python 3", packages: ["python3", "python3-pip"] },
        { key: "curl", label: "curl", packages: ["curl"] },
        { key: "openssh-server", label: "OpenSSH server", packages: ["openssh-server"] },
        { key: "sudo", label: "sudo", packages: ["sudo"] },
        { key: "ca-certificates", label: "CA certificates", packages: ["ca-certificates"] }
      ]
    }, lt = /* @__PURE__ */ N("debian"), Ct = /* @__PURE__ */ N(""), jn = /* @__PURE__ */ N(""), Qt = /* @__PURE__ */ N(""), Dr = ye(() => lt.value === Yo), Br = ye(() => Ct.value === cs), Ao = ye(() => Dr.value ? jn.value : lt.value), Eo = ye(
      () => Br.value ? Qt.value : Ct.value
    ), ya = ye(() => Lt[lt.value] ?? []);
    bt(lt, () => {
      const c = Lt[lt.value];
      Ct.value = c && c.length > 0 ? c[0].value : cs, Qt.value = "";
    });
    {
      const c = Lt[lt.value];
      Ct.value = c && c.length > 0 ? c[0].value : cs;
    }
    const is = /* @__PURE__ */ N(""), hs = /* @__PURE__ */ N(""), Nn = /* @__PURE__ */ N(!1), Ks = /* @__PURE__ */ N(null), Gs = /* @__PURE__ */ N([]), bs = /* @__PURE__ */ N(null), Js = /* @__PURE__ */ N(!1);
    function xa(c) {
      return c.split(/[\n,]/).map((r) => r.trim()).filter((r) => r.length > 0);
    }
    function Fr() {
      const c = xa(is.value);
      return Array.from(/* @__PURE__ */ new Set([...Array.from(Ne), ...c]));
    }
    const as = /* @__PURE__ */ N(""), vs = /* @__PURE__ */ N([]), Ys = /* @__PURE__ */ N([]), Io = /* @__PURE__ */ N(!1), Qs = /* @__PURE__ */ N(null);
    let ys = null, xs = 0;
    const Ne = /* @__PURE__ */ Gt(/* @__PURE__ */ new Set()), De = /* @__PURE__ */ Gt(/* @__PURE__ */ new Map()), Hr = { apt: "apt", npm: "npm", pypi: "PyPI", brew: "brew" };
    function zr() {
      if (ys && clearTimeout(ys), ys = null, ++xs, as.value.trim().length < 2) {
        vs.value = [], Ys.value = [], Qs.value = null;
        return;
      }
      ys = setTimeout(_a, Qh);
    }
    bt(as, zr), bt(lt, () => {
      Ne.clear(), De.clear(), zr();
    });
    async function _a() {
      const c = as.value.trim();
      if (c.length < 2) return;
      const r = xs;
      Io.value = !0, Qs.value = null;
      try {
        const d = await pe(
          dp,
          { query: c, distro: Ao.value, release: Eo.value }
        );
        if (r !== xs) return;
        vs.value = d.searchAllPackages.results, Ys.value = d.searchAllPackages.errors;
      } catch (d) {
        if (r !== xs) return;
        Qs.value = d instanceof Error ? d.message : String(d), vs.value = [], Ys.value = [];
      } finally {
        r === xs && (Io.value = !1);
      }
    }
    function wa(c) {
      Ne.add(c.name);
    }
    function ka(c) {
      Ne.delete(c);
    }
    function To(c) {
      var d;
      const r = (d = Ur[lt.value]) == null ? void 0 : d.find(($) => $.key === c);
      if (r)
        for (const $ of r.packages) Ne.add($);
    }
    function Sa(c) {
      To("nodejs"), De.set(`npm:${c.name}`, `npm install -g ${c.name}`);
    }
    function Ca(c) {
      To("python3"), De.set(`pypi:${c.name}`, `pip3 install ${c.name}`);
    }
    function Aa(c) {
      De.delete(c);
    }
    function Ea(c) {
      c.ecosystem === "apt" ? wa(c) : c.ecosystem === "npm" ? Sa(c) : c.ecosystem === "pypi" && Ca(c);
    }
    function Wr(c) {
      return c.ecosystem === "apt" ? Ne.has(c.name) : c.ecosystem === "npm" ? De.has(`npm:${c.name}`) : c.ecosystem === "pypi" ? De.has(`pypi:${c.name}`) : !1;
    }
    function Po(c, r) {
      Lr.some((d) => d.value === c) ? (lt.value = c, (Lt[c] ?? []).some(($) => $.value === r) ? (Ct.value = r, Qt.value = "") : (Ct.value = cs, Qt.value = r)) : (lt.value = Yo, jn.value = c, Ct.value = cs, Qt.value = r);
    }
    function Zs() {
      bs.value = null;
    }
    function Ia(c) {
      var ee, Fe, Ye, it;
      const r = c.toLowerCase(), d = (Te) => Te.find((ht) => r.includes(ht));
      if (r.includes("alpine")) {
        const Te = (ee = r.match(/(\d+\.\d+)/)) == null ? void 0 : ee[1];
        return { distro: "alpinelinux", release: Te && Lt.alpinelinux.some((Oo) => Oo.value === Te) ? Te : "3.24" };
      }
      if (r.includes("fedora")) {
        const Te = (Fe = r.match(/fedora[:\-](\d+)/)) == null ? void 0 : Fe[1];
        return { distro: "fedora", release: Te && Lt.fedora.some((Oo) => Oo.value === Te) ? Te : "44" };
      }
      if (r.includes("rockylinux") || r.includes("rocky")) {
        const Te = (Ye = r.match(/(\d+)/)) == null ? void 0 : Ye[1];
        return { distro: "rockylinux", release: Te === "9" || Te === "10" ? Te : "10" };
      }
      if (r.includes("almalinux") || r.includes("alma")) {
        const Te = (it = r.match(/(\d+)/)) == null ? void 0 : it[1];
        return { distro: "almalinux", release: Te === "9" || Te === "10" ? Te : "10" };
      }
      const $ = d(["jammy", "noble", "resolute", "focal", "bionic"]);
      if (r.includes("ubuntu") || $)
        return { distro: "ubuntu", release: $ && Lt.ubuntu.some((ht) => ht.value === $) ? $ : "noble" };
      const H = d(["bookworm", "trixie", "sid", "bullseye", "buster"]);
      return r.includes("debian") || H || r.startsWith("node:") || r.startsWith("python:") || r.includes("/node") || r.includes("/python") ? { distro: "debian", release: H && Lt.debian.some((ht) => ht.value === H) ? H : "bookworm" } : null;
    }
    function Ta(c) {
      const r = c.toLowerCase();
      return r.includes("/node") ? "nodejs" : r.includes("/python") ? "python3" : null;
    }
    function Pa(c) {
      var H;
      const r = JSON.parse(Ra(c)), d = { distroSet: !1, packagesAdded: [], commandsAdded: [], skipped: [] };
      if (Zs(), Ne.clear(), De.clear(), is.value = "", typeof r.image == "string") {
        const ee = Ia(r.image);
        ee ? (Po(ee.distro, ee.release), d.distroSet = !0) : d.skipped.push(`image "${r.image}" — couldn't infer a matching distro/release, pick manually`);
      } else r.build && d.skipped.push(`"build.dockerfile" — Dockerfile-based devcontainers aren't translated, pick a distro/release manually`);
      if (r.features && typeof r.features == "object")
        for (const ee of Object.keys(r.features)) {
          const Fe = Ta(ee);
          if (Fe) {
            const Ye = (H = Ur[lt.value]) == null ? void 0 : H.find((it) => it.key === Fe);
            if (Ye) {
              for (const it of Ye.packages)
                Ne.has(it) || (Ne.add(it), d.packagesAdded.push(it));
              continue;
            }
          }
          if (ee.includes("/git")) {
            Ne.has("git") || (Ne.add("git"), d.packagesAdded.push("git"));
            continue;
          }
          if (ee.includes("/common-utils")) {
            for (const Ye of ["curl", "sudo", "ca-certificates"])
              Ne.has(Ye) || (Ne.add(Ye), d.packagesAdded.push(Ye));
            continue;
          }
          d.skipped.push(`feature "${ee}" — not recognized, add its packages manually if needed`);
        }
      const $ = [
        ["postCreateCommand", r.postCreateCommand],
        ["postStartCommand", r.postStartCommand]
      ];
      for (const [ee, Fe] of $) {
        if (!Fe) continue;
        (Array.isArray(Fe) ? Fe.map(String) : [String(Fe)]).forEach((it, Te) => {
          const ht = `devcontainer:${ee}:${Te}`;
          De.set(ht, it), d.commandsAdded.push(it);
        });
      }
      return (r.remoteUser || r.containerUser) && d.skipped.push(`remoteUser/containerUser "${r.remoteUser ?? r.containerUser}" — not mapped, this plugin uses one fixed agent user (Config → Jail Defaults)`), (r.forwardPorts || r.mounts || r.workspaceFolder) && d.skipped.push("forwardPorts/mounts/workspaceFolder — IDE/runtime concerns, not applicable to image building"), d;
    }
    function Ra(c) {
      return c.replace(/\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1");
    }
    const Xs = /* @__PURE__ */ N(null), At = /* @__PURE__ */ N(null), qr = /* @__PURE__ */ N(null);
    function Ma() {
      var c;
      (c = qr.value) == null || c.click();
    }
    function $a(c) {
      var $;
      const r = ($ = c.target.files) == null ? void 0 : $[0];
      if (!r) return;
      Xs.value = null, At.value = null;
      const d = new FileReader();
      d.onload = () => {
        try {
          At.value = Pa(String(d.result));
        } catch (H) {
          Xs.value = H instanceof Error ? H.message : String(H);
        }
      }, d.onerror = () => {
        Xs.value = "Failed to read the file.";
      }, d.readAsText(r), c.target.value = "";
    }
    function Va(c) {
      const r = c == null ? void 0 : c.tools;
      if (!r || typeof r != "object") return [];
      const d = [];
      for (const [$, H] of Object.entries(r))
        typeof H == "string" ? d.push({ tool: $, version: H }) : Array.isArray(H) && typeof H[0] == "string" ? d.push({ tool: $, version: H[0] }) : H && typeof H == "object" && typeof H.version == "string" && d.push({ tool: $, version: H.version });
      return d;
    }
    function Oa(c) {
      const r = [];
      for (const d of c.split(`
`)) {
        const $ = d.split("#")[0].trim();
        if (!$) continue;
        const [H, ee] = $.split(/\s+/);
        H && ee && r.push({ tool: H, version: ee });
      }
      return r;
    }
    function Kr() {
      To("build-tools"), Ne.has("curl") || Ne.add("curl"), Ne.has("ca-certificates") || Ne.add("ca-certificates"), De.set("mise:env", "export MISE_DATA_DIR=/opt/mise MISE_CONFIG_DIR=/etc/mise"), De.set("mise:install", "curl https://mise.run | MISE_INSTALL_PATH=/usr/local/bin/mise sh"), De.set(
        "mise:profile",
        `printf 'export MISE_DATA_DIR=/opt/mise MISE_CONFIG_DIR=/etc/mise\\neval "$(/usr/local/bin/mise activate bash)"\\n' > /etc/profile.d/mise.sh && chmod +x /etc/profile.d/mise.sh`
      );
    }
    function Gr(c) {
      if (c.length === 0) return [];
      Kr();
      const r = c.map((d) => `${d.tool}@${d.version}`);
      return De.set("mise:use-tools", `mise use -g ${r.join(" ")}`), r;
    }
    async function ja(c) {
      const d = (await import("./incus-settings-index-D8Q71tKU.js")).parse(c), $ = Va(d);
      if ($.length === 0) throw new Error("No [tools] entries found in this mise.toml.");
      return { toolsAdded: Gr($) };
    }
    function Na(c) {
      const r = Oa(c);
      if (r.length === 0) throw new Error("No tool/version lines found in this .tool-versions file.");
      return { toolsAdded: Gr(r) };
    }
    const _s = /* @__PURE__ */ N(null), en = /* @__PURE__ */ N(null), Jr = /* @__PURE__ */ N(null), Yr = /* @__PURE__ */ N(null);
    function Qr(c, r) {
      var H;
      const d = (H = c.target.files) == null ? void 0 : H[0];
      if (!d) return;
      _s.value = null, en.value = null;
      const $ = new FileReader();
      $.onload = async () => {
        try {
          const ee = r === "toml" ? await ja(String($.result)) : Na(String($.result));
          en.value = ee.toolsAdded;
        } catch (ee) {
          _s.value = ee instanceof Error ? ee.message : String(ee);
        }
      }, $.onerror = () => {
        _s.value = "Failed to read the file.";
      }, $.readAsText(d), c.target.value = "";
    }
    const ws = /* @__PURE__ */ N(""), tn = /* @__PURE__ */ N("");
    function La() {
      const c = ws.value.trim();
      if (!c) return;
      Kr(), Ne.has("git") || Ne.add("git");
      const r = tn.value.trim(), d = r ? `git clone --depth 1 --branch ${r} ${c} /opt/dotfiles-src` : `git clone --depth 1 ${c} /opt/dotfiles-src`;
      De.set("mise:dotfiles-clone", d), De.set(
        "mise:dotfiles-bootstrap",
        "cp /opt/dotfiles-src/mise.toml /opt/dotfiles-src/.mise.toml /etc/mise/config.d/dotfiles.toml 2>/dev/null; MISE_EXPERIMENTAL=1 mise bootstrap --yes || true"
      );
    }
    function Ua() {
      De.delete("mise:dotfiles-clone"), De.delete("mise:dotfiles-bootstrap"), ws.value = "", tn.value = "";
    }
    const Ro = /* @__PURE__ */ N([]), sn = /* @__PURE__ */ N(""), Ln = /* @__PURE__ */ N(!1), ks = /* @__PURE__ */ N(null);
    async function Mo() {
      const c = await pe(fp);
      Me && (Ro.value = c.builderPresets);
    }
    async function Da() {
      const c = sn.value.trim();
      if (c) {
        ks.value = null, Ln.value = !0;
        try {
          await pe(pp, {
            input: {
              name: c,
              distro: Ao.value.trim(),
              release: Eo.value.trim(),
              packages: Fr()
            }
          }), sn.value = "", await Mo();
        } catch (r) {
          ks.value = r instanceof Error ? r.message : String(r);
        } finally {
          Ln.value = !1;
        }
      }
    }
    function Ba(c) {
      Po(c.distro, c.release), is.value = c.packages.join(`
`), hs.value = "", Zs();
    }
    async function Fa(c) {
      ks.value = null;
      try {
        await pe(mp, { name: c }), await Mo();
      } catch (r) {
        ks.value = r instanceof Error ? r.message : String(r);
      }
    }
    const Et = /* @__PURE__ */ N([]), Ut = /* @__PURE__ */ N(null), $o = /* @__PURE__ */ N(null);
    async function Un() {
      const c = await pe(gp);
      Me && (Et.value = c.jailImages);
    }
    async function Ha(c) {
      var d;
      if (c.isMaster) return;
      Ut.value = null, $o.value = c.alias;
      const r = ((d = Et.value.find(($) => $.isMaster)) == null ? void 0 : d.alias) ?? null;
      try {
        await pe(Jo, { alias: c.alias, isMaster: !0 }), await pe(Bl, { input: { jailImage: c.alias } }), await Promise.all([Un(), Le()]);
      } catch ($) {
        await Promise.allSettled([
          r ? pe(Jo, { alias: r, isMaster: !0 }) : pe(Jo, { alias: c.alias, isMaster: !1 })
        ]), await Promise.allSettled([Un(), Le()]), Ut.value = $ instanceof Error ? $.message : String($);
      } finally {
        $o.value = null;
      }
    }
    function za(c) {
      Po(c.distro, c.release), is.value = c.packages.join(`
`), hs.value = "", bs.value = c.alias;
    }
    const Vo = /* @__PURE__ */ N(null);
    async function Wa(c) {
      if (confirm(`Delete image "${c.alias}"? This removes it from Incus and cannot be undone.`)) {
        Ut.value = null, Vo.value = c.alias;
        try {
          await pe(up, { alias: c.alias }), Et.value = Et.value.filter((r) => r.alias !== c.alias), bs.value === c.alias && Zs();
        } catch (r) {
          Ut.value = r instanceof Error ? r.message : String(r);
        } finally {
          Vo.value = null;
        }
      }
    }
    function qa(c) {
      return c.length === 0 ? "no packages" : c.join(", ");
    }
    const Dn = /* @__PURE__ */ N(!1), nn = /* @__PURE__ */ N("");
    async function Ka() {
      Dn.value = !0, Ut.value = null, nn.value = "";
      try {
        const c = await pe(hp);
        c.pruneStaleImageRecords.length === 0 ? nn.value = "Nothing to prune — every saved image still exists in Incus." : (nn.value = `Untracked ${c.pruneStaleImageRecords.length}: ${c.pruneStaleImageRecords.join(", ")}`, Et.value = Et.value.filter((r) => !c.pruneStaleImageRecords.includes(r.alias)));
      } catch (c) {
        Ut.value = c instanceof Error ? c.message : String(c);
      } finally {
        Dn.value = !1;
      }
    }
    function Bn(c) {
      c.intervalId !== null && (c.intervalId.stop(), c.intervalId = null);
    }
    function Ga(c) {
      c.intervalId = Kn(async (r) => {
        var d, $;
        try {
          const H = await pe(cp, {
            buildId: c.buildId
          });
          if (!r.isActive()) return;
          if (c.status = H.jailImageBuildStatus, ((d = c.status) == null ? void 0 : d.status) === "success") {
            Bn(c);
            try {
              await Un();
            } catch (ee) {
              Ut.value = ee instanceof Error ? ee.message : String(ee);
            }
          } else (($ = c.status) == null ? void 0 : $.status) === "failed" && Bn(c);
        } catch (H) {
          if (!r.isActive()) return;
          c.error = H instanceof Error ? H.message : String(H), Bn(c);
        }
      }, Ko);
    }
    async function Ja() {
      Ks.value = null;
      const c = Ao.value.trim(), r = Eo.value.trim(), d = hs.value.trim(), $ = Fr();
      if (!c || !r || !d) {
        Ks.value = "Distro, release, and alias are required.";
        return;
      }
      Nn.value = !0;
      try {
        const ee = {
          buildId: (await pe(ap, {
            distro: c,
            release: r,
            packages: $,
            alias: d,
            basedOn: bs.value || null,
            postInstallCommands: Array.from(De.values())
          })).buildJailImage,
          distro: c,
          release: r,
          alias: d,
          status: null,
          error: null,
          intervalId: null
        };
        Gs.value.unshift(ee), Ga(Gs.value[0]);
        const Fe = Lt[lt.value];
        Ct.value = Fe && Fe.length > 0 ? Fe[0].value : cs, Qt.value = "", hs.value = "", is.value = "", Ne.clear(), De.clear(), vs.value = [], as.value = "", en.value = null, _s.value = null, ws.value = "", tn.value = "", Zs();
      } catch (H) {
        Ks.value = H instanceof Error ? H.message : String(H);
      } finally {
        Nn.value = !1;
      }
    }
    function Ya(c) {
      switch (c) {
        case "success":
          return "green";
        case "failed":
          return "red";
        case "running":
          return "orange";
        default:
          return "gray";
      }
    }
    return ki(() => {
      Me = !1, ++tt, ++xs;
      for (const c of Gs.value) Bn(c);
      Co(), yt(), Ds(), ys && clearTimeout(ys);
    }), (c, r) => (C(), R("div", wp, [
      n.value ? (C(), R("div", kp, "Loading incus configuration…")) : (C(), R(ue, { key: 1 }, [
        l.value ? (C(), R("div", Sp, M(l.value), 1)) : W("", !0),
        f("header", Cp, [
          r[52] || (r[52] = Dd('<svg width="14" height="20" viewBox="0 0 10 14" fill="none" aria-hidden="true" class="shrink-0 text-foreground"><path d="M5 0L9 2.5L5 5L1 2.5Z" fill="currentColor" opacity="0.95"></path><path d="M5 3L9 5.5L5 8L1 5.5Z" fill="currentColor" opacity="0.7"></path><path d="M5 6L9 8.5L5 11L1 8.5Z" fill="currentColor" opacity="0.45"></path><path d="M5 9L9 11.5L5 14L1 11.5Z" fill="currentColor" opacity="0.25"></path></svg><span class="text-sm font-semibold tracking-[0.14em] uppercase">Incus</span><span class="text-xs text-muted-foreground">dev containers</span>', 3)),
          f("div", Ap, [
            y(m(Ft), {
              variant: i.value ? "green" : "red"
            }, {
              default: S(() => [
                _(M(i.value ? "Reachable" : "Not running"), 1)
              ]),
              _: 1
            }, 8, ["variant"]),
            y(m(fe), {
              size: "sm",
              variant: "outline",
              onClick: mt
            }, {
              default: S(() => [...r[51] || (r[51] = [
                _("Refresh", -1)
              ])]),
              _: 1
            })
          ])
        ]),
        y(Wf, {
          modelValue: s.value,
          "onUpdate:modelValue": r[0] || (r[0] = (d) => s.value = d)
        }, null, 8, ["modelValue"]),
        s.value === "builder" ? (C(), R("section", Ep, [
          f("div", Ip, [
            f("div", null, [
              r[77] || (r[77] = f("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Starting points", -1)),
              f("div", Tp, [
                r[76] || (r[76] = f("h3", { class: "mb-2 text-sm font-semibold" }, "Presets", -1)),
                ks.value ? (C(), R("p", Pp, M(ks.value), 1)) : W("", !0),
                Ro.value.length === 0 ? (C(), R("p", Rp, "Save the form below as a preset to reuse it later.")) : (C(), R("div", Mp, [
                  (C(!0), R(ue, null, Qe(Ro.value, (d) => (C(), R("div", {
                    key: d.name,
                    class: "flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
                  }, [
                    f("button", {
                      type: "button",
                      class: "cursor-pointer font-medium hover:text-primary",
                      onClick: ($) => Ba(d)
                    }, M(d.name), 9, $p),
                    f("span", Vp, M(d.distro) + "/" + M(d.release), 1),
                    f("button", {
                      type: "button",
                      class: "cursor-pointer text-muted-foreground hover:text-destructive",
                      "aria-label": "Delete preset",
                      onClick: ($) => Fa(d.name)
                    }, "✕", 8, Op)
                  ]))), 128))
                ])),
                f("div", jp, [
                  y(m(oe), {
                    for: "new-preset-name",
                    class: "sr-only"
                  }, {
                    default: S(() => [...r[53] || (r[53] = [
                      _("Preset name", -1)
                    ])]),
                    _: 1
                  }),
                  y(m(he), {
                    id: "new-preset-name",
                    modelValue: sn.value,
                    "onUpdate:modelValue": r[1] || (r[1] = (d) => sn.value = d),
                    placeholder: "Preset name",
                    class: "w-56"
                  }, null, 8, ["modelValue"]),
                  y(m(fe), {
                    size: "sm",
                    variant: "outline",
                    disabled: Ln.value || !sn.value.trim(),
                    onClick: Da
                  }, {
                    default: S(() => [
                      _(M(Ln.value ? "Saving…" : "Save as preset"), 1)
                    ]),
                    _: 1
                  }, 8, ["disabled"])
                ]),
                y(m(le), null, {
                  default: S(() => [...r[54] || (r[54] = [
                    _(" Saves distro, release, and the current package/tool list — not the alias, since that should stay unique per build. Saving under a name that already exists overwrites it. ", -1)
                  ])]),
                  _: 1
                }),
                f("div", Np, [
                  f("div", Lp, [
                    r[55] || (r[55] = f("h3", { class: "text-sm font-semibold" }, "Saved images", -1)),
                    Et.value.length > 0 ? (C(), Ie(m(fe), {
                      key: 0,
                      size: "sm",
                      variant: "outline",
                      disabled: Dn.value,
                      onClick: Ka
                    }, {
                      default: S(() => [
                        _(M(Dn.value ? "Checking…" : "Prune stale records"), 1)
                      ]),
                      _: 1
                    }, 8, ["disabled"])) : W("", !0)
                  ]),
                  Ut.value ? (C(), R("p", Up, M(Ut.value), 1)) : W("", !0),
                  nn.value ? (C(), R("p", Dp, M(nn.value), 1)) : W("", !0),
                  Et.value.length === 0 ? (C(), R("p", Bp, " No images built yet — the first one you build can become the golden master. ")) : (C(), R("div", Fp, [
                    (C(!0), R(ue, null, Qe([...Et.value].sort((d, $) => ($.isMaster ? 1 : 0) - (d.isMaster ? 1 : 0)), (d) => (C(), R("div", {
                      key: d.alias,
                      class: ot(["flex items-center gap-3 rounded-md border px-3 py-2", d.isMaster ? "border-primary bg-primary/5" : "border-border"])
                    }, [
                      f("div", Hp, [
                        f("div", zp, [
                          f("span", Wp, M(d.alias), 1),
                          d.isMaster ? (C(), Ie(m(Ft), {
                            key: 0,
                            variant: "orange"
                          }, {
                            default: S(() => [...r[56] || (r[56] = [
                              _("Golden master", -1)
                            ])]),
                            _: 1
                          })) : W("", !0),
                          f("span", qp, M(d.distro) + "/" + M(d.release), 1)
                        ]),
                        f("p", Kp, M(qa(d.packages)), 1)
                      ]),
                      y(m(fe), {
                        size: "sm",
                        variant: "outline",
                        disabled: d.isMaster || $o.value === d.alias,
                        onClick: ($) => Ha(d),
                        title: d.isMaster ? "Current launch default; choose another image to replace it" : "New containers launch from this image by default"
                      }, {
                        default: S(() => [
                          _(M(d.isMaster ? "Default" : "Set as default"), 1)
                        ]),
                        _: 2
                      }, 1032, ["disabled", "onClick", "title"]),
                      y(m(fe), {
                        size: "sm",
                        variant: "secondary",
                        onClick: ($) => za(d)
                      }, {
                        default: S(() => [...r[57] || (r[57] = [
                          _("Build variant", -1)
                        ])]),
                        _: 1
                      }, 8, ["onClick"]),
                      y(m(fe), {
                        size: "sm",
                        variant: "destructive",
                        disabled: Vo.value === d.alias,
                        onClick: ($) => Wa(d)
                      }, {
                        default: S(() => [...r[58] || (r[58] = [
                          _("Delete", -1)
                        ])]),
                        _: 1
                      }, 8, ["disabled", "onClick"])
                    ], 2))), 128))
                  ])),
                  y(m(le), null, {
                    default: S(() => [...r[59] || (r[59] = [
                      _(` Only one image can be the golden master at a time — marking a new one unmarks the previous. Marking it also sets it as the default image new containers launch from (Config → Container Defaults), so this is more than a label. "Build variant" pre-fills the form from that image's distro/release/packages so you can edit, extend, or strip it down before building a new one. "Prune stale records" checks every saved image still actually exists in Incus and untracks any that don't — useful if one was deleted directly via the incus CLI instead of through here. `, -1)
                    ])]),
                    _: 1
                  })
                ]),
                f("div", Gp, [
                  f("button", {
                    type: "button",
                    "aria-expanded": Js.value,
                    "aria-controls": "config-import-panel",
                    class: "flex w-full cursor-pointer items-center gap-1.5 text-left text-sm font-semibold",
                    onClick: r[2] || (r[2] = (d) => Js.value = !Js.value)
                  }, [
                    f("span", {
                      class: ot(["text-muted-foreground transition-transform", Js.value ? "rotate-90" : ""])
                    }, "▸", 2),
                    r[60] || (r[60] = _(" Import from a config file ", -1)),
                    r[61] || (r[61] = f("span", { class: "font-normal text-xs text-muted-foreground" }, "devcontainer.json, mise.toml, .tool-versions", -1))
                  ], 8, Jp),
                  Js.value ? (C(), R("div", Yp, [
                    f("div", null, [
                      r[66] || (r[66] = f("p", { class: "mb-2 text-xs text-muted-foreground" }, " devcontainer.json — maps the base image and recognized features to real packages; anything that isn't applicable to image building is reported, not silently dropped. ", -1)),
                      f("input", {
                        ref_key: "devcontainerFileInput",
                        ref: qr,
                        type: "file",
                        accept: ".json,application/json",
                        class: "hidden",
                        onChange: $a
                      }, null, 544),
                      y(m(fe), {
                        size: "sm",
                        variant: "outline",
                        onClick: Ma
                      }, {
                        default: S(() => [...r[62] || (r[62] = [
                          _("Choose devcontainer.json…", -1)
                        ])]),
                        _: 1
                      }),
                      Xs.value ? (C(), R("p", Qp, M(Xs.value), 1)) : W("", !0),
                      At.value ? (C(), R("div", Zp, [
                        At.value.distroSet ? (C(), R("p", Xp, [...r[63] || (r[63] = [
                          _("Distro/release set from ", -1),
                          f("span", { class: "font-mono" }, "image", -1),
                          _(".", -1)
                        ])])) : W("", !0),
                        At.value.packagesAdded.length > 0 ? (C(), R("p", em, [
                          r[64] || (r[64] = _(" Packages added: ", -1)),
                          f("span", tm, M(At.value.packagesAdded.join(", ")), 1)
                        ])) : W("", !0),
                        At.value.commandsAdded.length > 0 ? (C(), R("p", sm, M(At.value.commandsAdded.length) + " lifecycle command(s) added below — review before building. ", 1)) : W("", !0),
                        At.value.skipped.length > 0 ? (C(), R("div", nm, [
                          r[65] || (r[65] = f("p", { class: "text-muted-foreground" }, "Skipped (review manually):", -1)),
                          f("ul", om, [
                            (C(!0), R(ue, null, Qe(At.value.skipped, (d) => (C(), R("li", { key: d }, M(d), 1))), 128))
                          ])
                        ])) : W("", !0)
                      ])) : W("", !0)
                    ]),
                    f("div", rm, [
                      r[71] || (r[71] = f("p", { class: "mb-2 text-xs text-muted-foreground" }, [
                        _(" mise.toml / .tool-versions — pins exact tool versions by baking in "),
                        f("span", { class: "font-mono" }, "mise"),
                        _(" itself as a post-install step, wired system-wide so the container's actual runtime user can use the tools too. ")
                      ], -1)),
                      f("input", {
                        ref_key: "miseTomlFileInput",
                        ref: Jr,
                        type: "file",
                        accept: ".toml,application/toml",
                        class: "hidden",
                        onChange: r[3] || (r[3] = (d) => Qr(d, "toml"))
                      }, null, 544),
                      f("input", {
                        ref_key: "toolVersionsFileInput",
                        ref: Yr,
                        type: "file",
                        accept: ".tool-versions,text/plain",
                        class: "hidden",
                        onChange: r[4] || (r[4] = (d) => Qr(d, "tool-versions"))
                      }, null, 544),
                      f("div", lm, [
                        y(m(fe), {
                          size: "sm",
                          variant: "outline",
                          onClick: r[5] || (r[5] = (d) => {
                            var $;
                            return ($ = Jr.value) == null ? void 0 : $.click();
                          })
                        }, {
                          default: S(() => [...r[67] || (r[67] = [
                            _("Choose mise.toml…", -1)
                          ])]),
                          _: 1
                        }),
                        y(m(fe), {
                          size: "sm",
                          variant: "outline",
                          onClick: r[6] || (r[6] = (d) => {
                            var $;
                            return ($ = Yr.value) == null ? void 0 : $.click();
                          })
                        }, {
                          default: S(() => [...r[68] || (r[68] = [
                            _("Choose .tool-versions…", -1)
                          ])]),
                          _: 1
                        })
                      ]),
                      _s.value ? (C(), R("p", im, M(_s.value), 1)) : W("", !0),
                      en.value ? (C(), R("p", am, [
                        r[69] || (r[69] = _(" Tools pinned: ", -1)),
                        f("span", um, M(en.value.join(", ")), 1),
                        r[70] || (r[70] = _(" — see the setup commands below. ", -1))
                      ])) : W("", !0)
                    ]),
                    f("div", dm, [
                      y(m(oe), {
                        for: "dotfiles-repo",
                        class: "mb-1 block"
                      }, {
                        default: S(() => [...r[72] || (r[72] = [
                          _("Bootstrap dotfiles from a repo", -1)
                        ])]),
                        _: 1
                      }),
                      r[75] || (r[75] = f("p", { class: "mb-2 text-xs text-muted-foreground" }, [
                        _(" Experimental — clones the repo and hands off to "),
                        f("span", { class: "font-mono" }, "mise bootstrap"),
                        _(", which only applies dotfiles if that repo's own mise config declares them. ")
                      ], -1)),
                      f("div", cm, [
                        y(m(he), {
                          id: "dotfiles-repo",
                          modelValue: ws.value,
                          "onUpdate:modelValue": r[7] || (r[7] = (d) => ws.value = d),
                          class: "w-72 font-mono",
                          placeholder: "git@github.com:you/dotfiles.git"
                        }, null, 8, ["modelValue"]),
                        y(m(he), {
                          modelValue: tn.value,
                          "onUpdate:modelValue": r[8] || (r[8] = (d) => tn.value = d),
                          "aria-label": "Dotfiles branch or tag (optional)",
                          class: "w-32 font-mono",
                          placeholder: "branch (optional)"
                        }, null, 8, ["modelValue"]),
                        y(m(fe), {
                          size: "sm",
                          variant: "outline",
                          disabled: !ws.value.trim(),
                          onClick: La
                        }, {
                          default: S(() => [...r[73] || (r[73] = [
                            _("Add bootstrap", -1)
                          ])]),
                          _: 1
                        }, 8, ["disabled"]),
                        De.has("mise:dotfiles-clone") ? (C(), Ie(m(fe), {
                          key: 0,
                          size: "sm",
                          variant: "outline",
                          onClick: Ua
                        }, {
                          default: S(() => [...r[74] || (r[74] = [
                            _("Remove", -1)
                          ])]),
                          _: 1
                        })) : W("", !0)
                      ])
                    ])
                  ])) : W("", !0)
                ])
              ])
            ]),
            f("div", null, [
              r[94] || (r[94] = f("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Build", -1)),
              f("div", fm, [
                r[93] || (r[93] = f("h3", { class: "mb-4 text-base font-semibold" }, "Build container image", -1)),
                Ks.value ? (C(), R("div", pm, M(Ks.value), 1)) : W("", !0),
                bs.value ? (C(), R("div", mm, [
                  f("span", null, [
                    r[78] || (r[78] = _("Building variant of: ", -1)),
                    f("span", gm, M(bs.value), 1)
                  ]),
                  f("button", {
                    type: "button",
                    class: "ml-auto cursor-pointer text-muted-foreground hover:text-foreground",
                    onClick: Zs
                  }, " ✕ Clear ")
                ])) : W("", !0),
                f("div", hm, [
                  y(m(oe), { for: "builder-distro" }, {
                    default: S(() => [...r[79] || (r[79] = [
                      _("Distro", -1)
                    ])]),
                    _: 1
                  }),
                  f("div", bm, [
                    y(m(Cs), {
                      id: "builder-distro",
                      modelValue: lt.value,
                      "onUpdate:modelValue": r[9] || (r[9] = (d) => lt.value = d),
                      class: "w-48"
                    }, {
                      default: S(() => [
                        (C(), R(ue, null, Qe(Lr, (d) => f("option", {
                          key: d.value,
                          value: d.value
                        }, M(d.label), 9, vm)), 64)),
                        f("option", { value: Yo }, "Other… (custom)")
                      ]),
                      _: 1
                    }, 8, ["modelValue"]),
                    Dr.value ? (C(), Ie(m(he), {
                      key: 0,
                      id: "builder-custom-distro",
                      "aria-label": "Custom distro",
                      modelValue: jn.value,
                      "onUpdate:modelValue": r[10] || (r[10] = (d) => jn.value = d),
                      class: "w-40 font-mono",
                      placeholder: "e.g. archlinux"
                    }, null, 8, ["modelValue"])) : W("", !0)
                  ]),
                  y(m(le), { class: "col-span-2" }, {
                    default: S(() => [...r[80] || (r[80] = [
                      _(` The curated list is verified against distrobuilder's own real image definitions — pick "Other" for anything else it supports; distrobuilder covers more than this list captures. `, -1)
                    ])]),
                    _: 1
                  }),
                  y(m(oe), { for: "builder-release" }, {
                    default: S(() => [...r[81] || (r[81] = [
                      _("Release", -1)
                    ])]),
                    _: 1
                  }),
                  f("div", ym, [
                    y(m(Cs), {
                      id: "builder-release",
                      modelValue: Ct.value,
                      "onUpdate:modelValue": r[11] || (r[11] = (d) => Ct.value = d),
                      class: "w-48"
                    }, {
                      default: S(() => [
                        (C(!0), R(ue, null, Qe(ya.value, (d) => (C(), R("option", {
                          key: d.value,
                          value: d.value
                        }, M(d.label), 9, xm))), 128)),
                        f("option", { value: cs }, "Other… (custom)")
                      ]),
                      _: 1
                    }, 8, ["modelValue"]),
                    Br.value ? (C(), Ie(m(he), {
                      key: 0,
                      id: "builder-custom-release",
                      "aria-label": "Custom release",
                      modelValue: Qt.value,
                      "onUpdate:modelValue": r[12] || (r[12] = (d) => Qt.value = d),
                      class: "w-40 font-mono",
                      placeholder: "e.g. rolling"
                    }, null, 8, ["modelValue"])) : W("", !0)
                  ]),
                  y(m(le), { class: "col-span-2" }, {
                    default: S(() => [...r[82] || (r[82] = [
                      _("Options change with the distro above — a custom distro always shows the free-text field here too.", -1)
                    ])]),
                    _: 1
                  }),
                  y(m(oe), { for: "builder-alias" }, {
                    default: S(() => [...r[83] || (r[83] = [
                      _("Alias", -1)
                    ])]),
                    _: 1
                  }),
                  y(m(he), {
                    id: "builder-alias",
                    modelValue: hs.value,
                    "onUpdate:modelValue": r[13] || (r[13] = (d) => hs.value = d),
                    class: "w-96 justify-self-end",
                    placeholder: "my-custom-image"
                  }, null, 8, ["modelValue"]),
                  y(m(le), { class: "col-span-2" }, {
                    default: S(() => [...r[84] || (r[84] = [
                      _(` Becomes the image's name in Incus once the build succeeds — other containers (and "build variant") reference it by this alias, so it must be unique. Not required to match the container's own name. `, -1)
                    ])]),
                    _: 1
                  })
                ]),
                f("div", _m, [
                  r[90] || (r[90] = f("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Packages & tools", -1)),
                  y(m(oe), {
                    for: "package-search",
                    class: "sr-only"
                  }, {
                    default: S(() => [...r[85] || (r[85] = [
                      _("Search packages and tools", -1)
                    ])]),
                    _: 1
                  }),
                  y(m(he), {
                    id: "package-search",
                    modelValue: as.value,
                    "onUpdate:modelValue": r[14] || (r[14] = (d) => as.value = d),
                    class: "w-full font-mono",
                    placeholder: "Search apt, npm, PyPI, Homebrew…"
                  }, null, 8, ["modelValue"]),
                  y(m(le), null, {
                    default: S(() => [...r[86] || (r[86] = [
                      _(" apt only searches when Debian or Ubuntu is selected above. npm and PyPI results aren't OS packages — adding one adds a setup command that runs after packages install, and auto-adds the Node.js or Python packages it needs. Homebrew results show for browsing but can't be added yet — there's no way to bootstrap Homebrew itself inside an image build. ", -1)
                    ])]),
                    _: 1
                  }),
                  Qs.value ? (C(), R("p", wm, M(Qs.value), 1)) : W("", !0),
                  Ys.value.length > 0 ? (C(), R("p", km, [
                    r[87] || (r[87] = _(" Some sources are unavailable right now, showing results from the rest: ", -1)),
                    (C(!0), R(ue, null, Qe(Ys.value, (d, $) => (C(), R("span", {
                      key: d.ecosystem
                    }, [
                      _(M($ > 0 ? ", " : " "), 1),
                      f("strong", null, M(Hr[d.ecosystem]), 1)
                    ]))), 128))
                  ])) : W("", !0),
                  Io.value ? (C(), R("p", Sm, "Searching…")) : vs.value.length > 0 ? (C(), R("div", Cm, [
                    (C(!0), R(ue, null, Qe(vs.value, (d) => (C(), R("div", {
                      key: `${d.ecosystem}:${d.name}`,
                      class: "flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
                    }, [
                      f("span", {
                        class: ot(["shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase", d.ecosystem === "apt" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"])
                      }, M(Hr[d.ecosystem]), 3),
                      f("div", Am, [
                        f("span", Em, M(d.name), 1),
                        d.version ? (C(), R("span", Im, M(d.version), 1)) : W("", !0),
                        d.description ? (C(), R("p", Tm, M(d.description), 1)) : W("", !0)
                      ]),
                      d.ecosystem !== "brew" ? (C(), Ie(m(fe), {
                        key: 0,
                        size: "sm",
                        variant: "outline",
                        disabled: Wr(d),
                        onClick: ($) => Ea(d)
                      }, {
                        default: S(() => [
                          _(M(Wr(d) ? "Added" : "+ Add"), 1)
                        ]),
                        _: 2
                      }, 1032, ["disabled", "onClick"])) : (C(), R("span", Pm, "not build-time yet"))
                    ]))), 128))
                  ])) : as.value.trim().length >= 2 ? (C(), R("p", Rm, "No matches.")) : W("", !0),
                  Ne.size > 0 ? (C(), R("div", Mm, [
                    r[88] || (r[88] = f("p", { class: "mb-1.5 block text-xs font-medium" }, "Added from apt search", -1)),
                    f("div", $m, [
                      (C(!0), R(ue, null, Qe(Ne, (d) => (C(), R("span", {
                        key: d,
                        class: "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs"
                      }, [
                        _(M(d) + " ", 1),
                        f("button", {
                          type: "button",
                          "aria-label": `Remove apt package ${d}`,
                          class: "cursor-pointer text-muted-foreground hover:text-destructive",
                          onClick: ($) => ka(d)
                        }, "✕", 8, Vm)
                      ]))), 128))
                    ])
                  ])) : W("", !0),
                  De.size > 0 ? (C(), R("div", Om, [
                    r[89] || (r[89] = f("p", { class: "mb-1.5 block text-xs font-medium" }, "Extra setup commands (run after packages install)", -1)),
                    f("div", jm, [
                      (C(!0), R(ue, null, Qe(De, ([d, $]) => (C(), R("div", {
                        key: d,
                        class: "flex items-center gap-2 rounded-md border border-border px-2 py-1 font-mono text-xs"
                      }, [
                        f("span", Nm, M($), 1),
                        f("button", {
                          type: "button",
                          "aria-label": `Remove setup command ${d}`,
                          class: "cursor-pointer text-muted-foreground hover:text-destructive",
                          onClick: (H) => Aa(d)
                        }, "✕", 8, Lm)
                      ]))), 128))
                    ])
                  ])) : W("", !0)
                ]),
                f("div", Um, [
                  y(m(oe), {
                    for: "builder-extra-packages",
                    class: "mb-1.5 block text-xs text-muted-foreground"
                  }, {
                    default: S(() => [...r[91] || (r[91] = [
                      _("Anything else? (one per line, or comma-separated)", -1)
                    ])]),
                    _: 1
                  }),
                  vr(f("textarea", {
                    id: "builder-extra-packages",
                    "onUpdate:modelValue": r[15] || (r[15] = (d) => is.value = d),
                    rows: "2",
                    class: "border-input bg-background w-full rounded-md border px-3 py-2 text-sm font-mono",
                    placeholder: "e.g. htop"
                  }, null, 512), [
                    [ir, is.value]
                  ]),
                  y(m(le), null, {
                    default: S(() => [...r[92] || (r[92] = [
                      _(" Exact OS package names for the selected distro's package manager — merged with anything added from search above, duplicates removed. Use this for anything search didn't turn up. ", -1)
                    ])]),
                    _: 1
                  })
                ]),
                f("div", Dm, [
                  y(m(fe), {
                    disabled: Nn.value,
                    onClick: Ja
                  }, {
                    default: S(() => [
                      _(M(Nn.value ? "Starting…" : "Build"), 1)
                    ]),
                    _: 1
                  }, 8, ["disabled"])
                ])
              ])
            ])
          ]),
          r[98] || (r[98] = f("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Results", -1)),
          f("div", Bm, [
            r[97] || (r[97] = f("h3", { class: "mb-4 text-base font-semibold" }, "Builds", -1)),
            y(m(le), null, {
              default: S(() => [...r[95] || (r[95] = [
                _(" Live distrobuilder log output, streamed while a build runs. This list is client-side only and resets on page reload — successful builds still land in Saved images above, but the log history itself isn't persisted. ", -1)
              ])]),
              _: 1
            }),
            Gs.value.length === 0 ? (C(), R("div", Fm, [...r[96] || (r[96] = [
              f("span", { class: "h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-700" }, null, -1),
              f("span", { class: "font-mono text-[11px] text-neutral-500" }, [
                _(" Pick a distro and release above, then hit Build — progress and logs stream in here."),
                f("span", { class: "motion-safe:animate-pulse" }, "_")
              ], -1)
            ])])) : (C(), R("div", Hm, [
              (C(!0), R(ue, null, Qe(Gs.value, (d) => {
                var $, H, ee, Fe, Ye, it, Te;
                return C(), R("div", {
                  key: d.buildId,
                  class: "rounded-md border border-border p-3"
                }, [
                  f("div", zm, [
                    f("div", Wm, [
                      f("span", qm, M(d.alias), 1),
                      f("span", Km, M(d.distro) + " / " + M(d.release), 1)
                    ]),
                    y(m(Ft), {
                      variant: Ya(($ = d.status) == null ? void 0 : $.status)
                    }, {
                      default: S(() => {
                        var ht;
                        return [
                          _(M(((ht = d.status) == null ? void 0 : ht.status) ?? "queued"), 1)
                        ];
                      }),
                      _: 2
                    }, 1032, ["variant"])
                  ]),
                  (H = d.status) != null && H.error || d.error ? (C(), R("div", Gm, M(((ee = d.status) == null ? void 0 : ee.error) || d.error), 1)) : W("", !0),
                  f("div", Jm, [
                    f("span", {
                      class: ot(["h-1.5 w-1.5 shrink-0 rounded-full", {
                        "bg-emerald-500": ((Fe = d.status) == null ? void 0 : Fe.status) === "success",
                        "bg-red-500": ((Ye = d.status) == null ? void 0 : Ye.status) === "failed",
                        "bg-amber-500": ((it = d.status) == null ? void 0 : it.status) === "running" || !d.status
                      }])
                    }, null, 2),
                    f("span", Ym, "distrobuilder · " + M(d.buildId.slice(0, 8)), 1)
                  ]),
                  f("pre", Qm, M(((Te = d.status) == null ? void 0 : Te.logTail) || "Waiting for log output…"), 1)
                ]);
              }), 128))
            ]))
          ])
        ])) : s.value === "jails" ? (C(), R("section", Zm, [
          r[151] || (r[151] = f("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Dashboard", -1)),
          f("div", Xm, [
            f("div", eg, [
              r[99] || (r[99] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Total Containers", -1)),
              f("p", tg, M(a.value.length), 1)
            ]),
            f("div", sg, [
              r[100] || (r[100] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Running", -1)),
              f("p", ng, M(m(F).length), 1)
            ]),
            f("div", og, [
              r[101] || (r[101] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Stopped", -1)),
              f("p", rg, M(m(z)), 1)
            ]),
            f("div", lg, [
              r[102] || (r[102] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Daemon", -1)),
              f("div", ig, [
                y(m(Ft), {
                  variant: i.value ? "green" : "red"
                }, {
                  default: S(() => [
                    _(M(i.value ? "Reachable" : "Not running"), 1)
                  ]),
                  _: 1
                }, 8, ["variant"])
              ])
            ]),
            f("div", ag, [
              r[103] || (r[103] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Memory In Use", -1)),
              f("p", ug, M(m(Oe)(m(D))), 1)
            ]),
            f("div", dg, [
              r[104] || (r[104] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Total CPU (live)", -1)),
              f("p", cg, M(m(Je)()), 1),
              m(U).length >= 2 ? (C(), R("svg", fg, [
                f("polyline", {
                  points: m(dt)(m(U), "cpuPct"),
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "1.5"
                }, null, 8, pg)
              ])) : W("", !0),
              r[105] || (r[105] = f("p", { class: "mt-0.5 text-[10px] text-muted-foreground" }, "last ~2 min, sum of running containers", -1))
            ])
          ]),
          y(m(le), { class: "mb-6" }, {
            default: S(() => [...r[106] || (r[106] = [
              _(" CPU shown here is a live rate (% of one core), computed from the change in cumulative CPU time between polls every 5 seconds — not the raw counter Incus reports, which only ever goes up. The sparkline is a rolling client-side window that resets on page reload; nothing is persisted server-side. ", -1)
            ])]),
            _: 1
          }),
          f("div", mg, [
            f("div", gg, [
              r[112] || (r[112] = f("h3", { class: "mb-1 text-base font-semibold" }, "Network & ACL", -1)),
              r[113] || (r[113] = f("p", { class: "mb-3 text-xs text-muted-foreground" }, " The policy currently configured for every container on this bridge (from saved config, not a live probe). ", -1)),
              f("div", hg, [
                f("div", null, [
                  r[107] || (r[107] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Bridge", -1)),
                  f("p", bg, M(v.jailBridge || "—"), 1)
                ]),
                f("div", null, [
                  r[108] || (r[108] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Subnet", -1)),
                  f("p", vg, M(v.jailSubnet || "—"), 1)
                ]),
                f("div", null, [
                  r[109] || (r[109] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "ACL Name", -1)),
                  f("p", yg, M(v.aclName || "—"), 1)
                ]),
                f("div", null, [
                  r[110] || (r[110] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Blocked Ranges", -1)),
                  f("p", xg, M(da()) + " blocked", 1)
                ]),
                f("div", null, [
                  r[111] || (r[111] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Default Egress / Ingress", -1)),
                  f("p", _g, M(v.aclDefaultEgress) + " / " + M(v.aclDefaultIngress), 1)
                ])
              ])
            ]),
            f("div", wg, [
              r[119] || (r[119] = f("h3", { class: "mb-1 text-base font-semibold" }, "Launch Container", -1)),
              r[120] || (r[120] = f("p", { class: "mb-3 text-xs text-muted-foreground" }, " Applies the Container Defaults profile — no build step. Each container gets its own independent root filesystem and workspace even when launched from the same image. ", -1)),
              f("div", kg, [
                f("div", Sg, [
                  y(m(oe), {
                    for: "new-container-name",
                    class: "mb-2 block"
                  }, {
                    default: S(() => [...r[114] || (r[114] = [
                      _("Container name", -1)
                    ])]),
                    _: 1
                  }),
                  y(m(he), {
                    id: "new-container-name",
                    modelValue: u.value,
                    "onUpdate:modelValue": r[16] || (r[16] = (d) => u.value = d),
                    placeholder: "new-container-name",
                    class: "w-full font-mono"
                  }, null, 8, ["modelValue"])
                ]),
                f("div", Cg, [
                  y(m(oe), {
                    for: "launch-image",
                    class: "mb-2 block"
                  }, {
                    default: S(() => [...r[115] || (r[115] = [
                      _("Image", -1)
                    ])]),
                    _: 1
                  }),
                  y(m(Cs), {
                    id: "launch-image",
                    modelValue: A.value,
                    "onUpdate:modelValue": r[17] || (r[17] = (d) => A.value = d),
                    class: "w-full"
                  }, {
                    default: S(() => [
                      f("option", Ag, "Default (" + M(v.jailImage || "—") + ")", 1),
                      (C(!0), R(ue, null, Qe(Et.value, (d) => (C(), R("option", {
                        key: d.alias,
                        value: d.alias
                      }, M(d.alias) + M(d.isMaster ? " (golden master)" : "") + " — " + M(d.distro) + "/" + M(d.release), 9, Eg))), 128))
                    ]),
                    _: 1
                  }, 8, ["modelValue"])
                ]),
                y(m(fe), {
                  size: "sm",
                  variant: "secondary",
                  disabled: !!h.value,
                  onClick: $n
                }, {
                  default: S(() => [...r[116] || (r[116] = [
                    _("Launch", -1)
                  ])]),
                  _: 1
                }, 8, ["disabled"])
              ]),
              u.value && h.value ? (C(), R("p", Ig, M(h.value), 1)) : W("", !0),
              f("div", Tg, [
                y(m(un), {
                  id: "launch-allow-sudo",
                  modelValue: k.value,
                  "onUpdate:modelValue": r[18] || (r[18] = (d) => k.value = d)
                }, null, 8, ["modelValue"]),
                r[117] || (r[117] = f("label", {
                  for: "launch-allow-sudo",
                  class: "cursor-pointer text-xs"
                }, " Allow sudo (NOPASSWD) for the agent user ", -1))
              ]),
              y(m(le), null, {
                default: S(() => [...r[118] || (r[118] = [
                  _(` "Default" launches from Config → Container Defaults' image (the golden master, if one is set). Picking a specific image here launches from that image instead, just for this container — it doesn't change the default. Every launch, from any image, gets its own independent root filesystem; nothing is shared between containers built from the same source image. Sudo is off by default on purpose — the agent user having no path to root is what keeps a compromised dependency from escalating inside the container. Turning it on trades that away for convenience; you can also grant or check it later, per-container, from its Details panel. `, -1)
                ])]),
                _: 1
              })
            ])
          ]),
          f("div", Pg, [
            f("div", Rg, [
              r[121] || (r[121] = f("h3", { class: "text-base font-semibold" }, "Containers", -1)),
              m(z) > 0 ? (C(), Ie(m(fe), {
                key: 0,
                size: "sm",
                variant: "outline",
                disabled: jt.value,
                onClick: Ls
              }, {
                default: S(() => [
                  _(M(jt.value ? "Deleting…" : `Delete ${m(z)} stopped`), 1)
                ]),
                _: 1
              }, 8, ["disabled"])) : W("", !0)
            ]),
            y(m(le), null, {
              default: S(() => [...r[122] || (r[122] = [
                _(` "On bridge" means this container's address falls inside the configured subnet — a real check, not a claim that the LAN-ban ACL is actively enforced for it specifically (that's a daemon-level policy on the whole bridge, shown above under Network & ACL). Each row's mini charts are the same rolling client-side window as the summary cards above. `, -1)
              ])]),
              _: 1
            }),
            a.value.length === 0 ? (C(), R("p", Mg, " No containers yet — launch one above to get started. ")) : (C(), R(ue, { key: 1 }, [
              f("p", $g, " Total: " + M(m(F).length) + " container" + M(m(F).length === 1 ? "" : "s") + " running, " + M(m(Oe)(m(D))) + " memory, CPU time " + M(m(Z)(Number(m(K)))), 1),
              f("div", Vg, [
                (C(!0), R(ue, null, Qe(a.value, (d) => (C(), R("div", {
                  key: d.name,
                  class: ot(["rounded-lg border border-border p-3", m(ce) === d.name ? "border-primary/50" : "border-border"])
                }, [
                  f("div", Og, [
                    f("div", jg, [
                      f("span", Ng, M(d.name), 1),
                      va(d) ? (C(), R("span", Lg, "on bridge")) : W("", !0),
                      y(m(Ft), {
                        variant: ua(d.status)
                      }, {
                        default: S(() => [
                          _(M(d.status), 1)
                        ]),
                        _: 2
                      }, 1032, ["variant"])
                    ]),
                    f("span", Ug, M(d.ipv4 || "—"), 1)
                  ]),
                  f("div", Dg, [
                    f("div", null, [
                      f("p", {
                        class: "text-[10px] font-semibold tracking-[0.06em] uppercase text-muted-foreground",
                        title: `Live rate, % ${m(ae)()}`
                      }, "CPU", 8, Bg),
                      f("div", Fg, [
                        f("div", Hg, [
                          m(Re)(d) !== null ? (C(), R("div", {
                            key: 0,
                            class: "h-full rounded-full bg-primary",
                            style: _n({ width: m(Re)(d) + "%" })
                          }, null, 4)) : W("", !0)
                        ]),
                        f("span", zg, M(m(ke)(d)), 1),
                        m(ge)(d.name).length >= 2 ? (C(), R("svg", Wg, [
                          f("polyline", {
                            points: m(dt)(m(ge)(d.name), "cpuPct"),
                            fill: "none",
                            stroke: "currentColor",
                            "stroke-width": "1.5"
                          }, null, 8, qg)
                        ])) : W("", !0)
                      ])
                    ]),
                    f("div", null, [
                      r[123] || (r[123] = f("p", { class: "text-[10px] font-semibold tracking-[0.06em] uppercase text-muted-foreground" }, "Memory", -1)),
                      f("div", Kg, [
                        f("span", Gg, M(m(q)(d)), 1),
                        m(ge)(d.name).length >= 2 ? (C(), R("svg", Jg, [
                          f("polyline", {
                            points: m(dt)(m(ge)(d.name), "memPct"),
                            fill: "none",
                            stroke: "currentColor",
                            "stroke-width": "1.5"
                          }, null, 8, Yg)
                        ])) : W("", !0)
                      ]),
                      m(te)(d) !== null ? (C(), R("div", Qg, [
                        f("div", {
                          class: "h-full rounded-full bg-primary",
                          style: _n({ width: m(te)(d) + "%" })
                        }, null, 4)
                      ])) : W("", !0)
                    ])
                  ]),
                  f("div", Zg, [
                    y(m(fe), {
                      size: "sm",
                      variant: "outline",
                      onClick: ($) => Mn(d.name, "start")
                    }, {
                      default: S(() => [...r[124] || (r[124] = [
                        _("Start", -1)
                      ])]),
                      _: 1
                    }, 8, ["onClick"]),
                    y(m(fe), {
                      size: "sm",
                      variant: "outline",
                      onClick: ($) => Mn(d.name, "stop")
                    }, {
                      default: S(() => [...r[125] || (r[125] = [
                        _("Stop", -1)
                      ])]),
                      _: 1
                    }, 8, ["onClick"]),
                    y(m(fe), {
                      size: "sm",
                      variant: "secondary",
                      disabled: d.status.toLowerCase() !== "running",
                      onClick: ($) => O.value = d.name
                    }, {
                      default: S(() => [...r[126] || (r[126] = [
                        _("Console", -1)
                      ])]),
                      _: 1
                    }, 8, ["disabled", "onClick"]),
                    y(m(fe), {
                      size: "sm",
                      variant: "outline",
                      onClick: ($) => m(L)(d.name)
                    }, {
                      default: S(() => [
                        _(M(m(ce) === d.name ? "Hide manage" : "Manage"), 1)
                      ]),
                      _: 2
                    }, 1032, ["onClick"]),
                    y(m(fe), {
                      size: "sm",
                      variant: "destructive",
                      onClick: ($) => ls(d.name)
                    }, {
                      default: S(() => [...r[127] || (r[127] = [
                        _("Delete", -1)
                      ])]),
                      _: 1
                    }, 8, ["onClick"])
                  ]),
                  m(ce) === d.name ? (C(), R("div", Xg, [
                    m(b) ? (C(), R("p", eh, "Loading…")) : m(p) ? (C(), R(ue, { key: 1 }, [
                      f("div", th, [
                        f("div", null, [
                          r[128] || (r[128] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Image", -1)),
                          f("p", sh, M(m(p).imageOs || "—") + " " + M(m(p).imageRelease || ""), 1)
                        ]),
                        f("div", null, [
                          r[129] || (r[129] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Profiles", -1)),
                          f("p", nh, M(m(p).profiles.join(", ")), 1)
                        ]),
                        f("div", null, [
                          r[130] || (r[130] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Storage pool", -1)),
                          f("p", oh, M(m(p).storagePool || "—"), 1)
                        ]),
                        f("div", null, [
                          r[131] || (r[131] = f("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Bridge", -1)),
                          f("p", rh, M(m(p).networkBridge || "—"), 1)
                        ])
                      ]),
                      f("div", lh, [
                        f("div", ih, [
                          f("div", null, [
                            y(m(oe), {
                              for: "detail-cpu-limit",
                              class: "mb-1 flex items-center gap-1.5 text-xs"
                            }, {
                              default: S(() => [
                                r[133] || (r[133] = _(" CPU limit ", -1)),
                                m(p).cpuLimitIsOverride ? (C(), Ie(m(Ft), {
                                  key: 0,
                                  variant: "orange"
                                }, {
                                  default: S(() => [...r[132] || (r[132] = [
                                    _("override", -1)
                                  ])]),
                                  _: 1
                                })) : W("", !0)
                              ]),
                              _: 1
                            }),
                            f("div", ah, [
                              y(m(he), {
                                id: "detail-cpu-limit",
                                modelValue: m(P),
                                "onUpdate:modelValue": r[19] || (r[19] = ($) => /* @__PURE__ */ Pe(P) ? P.value = $ : null),
                                class: "w-24 font-mono",
                                placeholder: "e.g. 2"
                              }, null, 8, ["modelValue"]),
                              y(m(fe), {
                                size: "sm",
                                variant: "outline",
                                disabled: Ue.value,
                                onClick: j
                              }, {
                                default: S(() => [...r[134] || (r[134] = [
                                  _("Apply", -1)
                                ])]),
                                _: 1
                              }, 8, ["disabled"])
                            ])
                          ]),
                          f("div", null, [
                            y(m(oe), {
                              for: "detail-memory-limit",
                              class: "mb-1 flex items-center gap-1.5 text-xs"
                            }, {
                              default: S(() => [
                                r[136] || (r[136] = _(" Memory limit ", -1)),
                                m(p).memoryLimitIsOverride ? (C(), Ie(m(Ft), {
                                  key: 0,
                                  variant: "orange"
                                }, {
                                  default: S(() => [...r[135] || (r[135] = [
                                    _("override", -1)
                                  ])]),
                                  _: 1
                                })) : W("", !0)
                              ]),
                              _: 1
                            }),
                            f("div", uh, [
                              y(m(he), {
                                id: "detail-memory-limit",
                                modelValue: m(I),
                                "onUpdate:modelValue": r[20] || (r[20] = ($) => /* @__PURE__ */ Pe(I) ? I.value = $ : null),
                                class: "w-24 font-mono",
                                placeholder: "e.g. 4GiB"
                              }, null, 8, ["modelValue"]),
                              y(m(fe), {
                                size: "sm",
                                variant: "outline",
                                disabled: Ue.value,
                                onClick: T
                              }, {
                                default: S(() => [...r[137] || (r[137] = [
                                  _("Apply", -1)
                                ])]),
                                _: 1
                              }, 8, ["disabled"])
                            ])
                          ]),
                          m(p).cpuLimitIsOverride || m(p).memoryLimitIsOverride ? (C(), Ie(m(fe), {
                            key: 0,
                            size: "sm",
                            variant: "outline",
                            disabled: Ue.value,
                            onClick: Y
                          }, {
                            default: S(() => [...r[138] || (r[138] = [
                              _("Use profile default", -1)
                            ])]),
                            _: 1
                          }, 8, ["disabled"])) : W("", !0)
                        ]),
                        f("div", null, [
                          y(m(oe), {
                            for: "detail-workspace",
                            class: "mb-1 flex items-center gap-1.5 text-xs"
                          }, {
                            default: S(() => [
                              r[140] || (r[140] = _(" Workspace host path (/workspace) ", -1)),
                              m(p).workspaceIsOverride ? (C(), Ie(m(Ft), {
                                key: 0,
                                variant: "orange"
                              }, {
                                default: S(() => [...r[139] || (r[139] = [
                                  _("override", -1)
                                ])]),
                                _: 1
                              })) : W("", !0)
                            ]),
                            _: 1
                          }),
                          f("div", dh, [
                            y(m(he), {
                              id: "detail-workspace",
                              modelValue: m(E),
                              "onUpdate:modelValue": r[21] || (r[21] = ($) => /* @__PURE__ */ Pe(E) ? E.value = $ : null),
                              class: "flex-1 font-mono"
                            }, null, 8, ["modelValue"]),
                            y(m(fe), {
                              size: "sm",
                              variant: "outline",
                              disabled: Ue.value,
                              onClick: B
                            }, {
                              default: S(() => [...r[141] || (r[141] = [
                                _("Apply", -1)
                              ])]),
                              _: 1
                            }, 8, ["disabled"]),
                            m(p).workspaceIsOverride ? (C(), Ie(m(fe), {
                              key: 0,
                              size: "sm",
                              variant: "outline",
                              disabled: Ue.value,
                              onClick: G
                            }, {
                              default: S(() => [...r[142] || (r[142] = [
                                _("Use profile default", -1)
                              ])]),
                              _: 1
                            }, 8, ["disabled"])) : W("", !0)
                          ])
                        ])
                      ]),
                      Q(m(p)) ? (C(), R("div", ch, [
                        r[143] || (r[143] = f("span", null, [
                          _(" This container shares "),
                          f("span", { class: "font-mono" }, "/workspace"),
                          _(" with every other container still on the profile's default — file writes are live-visible between them. ")
                        ], -1)),
                        y(m(fe), {
                          size: "sm",
                          variant: "outline",
                          disabled: re.value,
                          onClick: _e
                        }, {
                          default: S(() => [
                            _(M(re.value ? "Isolating…" : "Isolate this container's workspace"), 1)
                          ]),
                          _: 1
                        }, 8, ["disabled"])
                      ])) : W("", !0),
                      m(w) ? (C(), R("p", fh, M(m(w)), 1)) : W("", !0),
                      y(m(le), null, {
                        default: S(() => [...r[144] || (r[144] = [
                          _(` Values without an "override" badge are inherited straight from the container's profile and apply to every container using it. Applying here overrides just this one instance — it won't touch the profile or any other container. Memory limit changes need a restart of this container to actually take effect on a running instance (verified: clearing an override alone doesn't shrink an already-larger live cgroup limit back down). Isolating a shared workspace points it at a new, empty per-container directory — it does not copy any files already sitting in the old shared one. `, -1)
                        ])]),
                        _: 1
                      }),
                      f("div", ph, [
                        f("p", mh, [
                          r[145] || (r[145] = _(" Sudo (agent user) ", -1)),
                          y(m(Ft), {
                            variant: m(p).sudoEnabled ? "green" : "gray"
                          }, {
                            default: S(() => [
                              _(M(m(p).sudoEnabled ? "enabled" : "disabled"), 1)
                            ]),
                            _: 1
                          }, 8, ["variant"])
                        ]),
                        m(p).sudoEnabled ? W("", !0) : (C(), Ie(m(fe), {
                          key: 0,
                          size: "sm",
                          variant: "outline",
                          disabled: ze.value,
                          onClick: gt
                        }, {
                          default: S(() => [
                            _(M(ze.value ? "Granting…" : "Grant sudo (NOPASSWD)"), 1)
                          ]),
                          _: 1
                        }, 8, ["disabled"])),
                        y(m(le), null, {
                          default: S(() => [...r[146] || (r[146] = [
                            _(" Off by default on purpose — this is what keeps a compromised dependency from escalating to root inside the container. Granting sudo here applies immediately to the running container and can't be un-granted from this panel (remove ", -1),
                            f("span", { class: "font-mono" }, "/etc/sudoers.d/agent", -1),
                            _(" manually, or via the privileged command box below, if you need to revoke it). ", -1)
                          ])]),
                          _: 1
                        })
                      ]),
                      f("div", gh, [
                        y(m(oe), {
                          for: "homebrew-formula",
                          class: "mb-1 block text-xs"
                        }, {
                          default: S(() => [...r[147] || (r[147] = [
                            _("Install a package (Homebrew)", -1)
                          ])]),
                          _: 1
                        }),
                        f("div", hh, [
                          y(m(he), {
                            id: "homebrew-formula",
                            modelValue: ie.value,
                            "onUpdate:modelValue": r[22] || (r[22] = ($) => ie.value = $),
                            class: "w-48 font-mono",
                            placeholder: "e.g. wget",
                            onKeydown: pn(fn(Us, ["prevent"]), ["enter"])
                          }, null, 8, ["modelValue", "onKeydown"]),
                          y(m(fe), {
                            size: "sm",
                            variant: "outline",
                            disabled: !ie.value.trim() || we.value,
                            onClick: Us
                          }, {
                            default: S(() => [
                              _(M(we.value ? "Installing…" : "Install"), 1)
                            ]),
                            _: 1
                          }, 8, ["disabled"])
                        ]),
                        $e.value ? (C(), R("p", bh, M($e.value), 1)) : W("", !0),
                        He.value ? (C(), R("p", vh, M(He.value), 1)) : W("", !0),
                        y(m(le), null, {
                          default: S(() => [...r[148] || (r[148] = [
                            _(` Best-effort: bootstraps Homebrew itself under this container's non-root "agent" user if it isn't already present (needs bash and git inside the container), installing to `, -1),
                            f("span", { class: "font-mono" }, "~/.linuxbrew", -1),
                            _(" rather than Homebrew's usual shared system path — the official installer needs ", -1),
                            f("span", { class: "font-mono" }, "sudo", -1),
                            _(` for that path, and "agent" deliberately has none inside these containers. This runs against the LIVE container over exec — it isn't baked into the image, so a rebuilt or replacement container won't have it. `, -1)
                          ])]),
                          _: 1
                        })
                      ]),
                      f("div", yh, [
                        y(m(oe), {
                          for: "privileged-command",
                          class: "mb-1 block text-xs"
                        }, {
                          default: S(() => [...r[149] || (r[149] = [
                            _("Run a privileged command", -1)
                          ])]),
                          _: 1
                        }),
                        f("div", xh, [
                          y(m(he), {
                            id: "privileged-command",
                            modelValue: Nt.value,
                            "onUpdate:modelValue": r[23] || (r[23] = ($) => Nt.value = $),
                            class: "flex-1 font-mono",
                            placeholder: "e.g. apt-get install -y htop",
                            onKeydown: pn(fn(Pr, ["prevent"]), ["enter"])
                          }, null, 8, ["modelValue", "onKeydown"]),
                          y(m(fe), {
                            size: "sm",
                            variant: "outline",
                            disabled: !Nt.value.trim() || kt.value,
                            onClick: Pr
                          }, {
                            default: S(() => [
                              _(M(kt.value ? "Running…" : "Run"), 1)
                            ]),
                            _: 1
                          }, 8, ["disabled"])
                        ]),
                        St.value ? (C(), R("div", _h, [
                          f("p", {
                            class: ot(["text-xs", St.value.status === "success" ? "text-unraid-green-800" : "text-destructive"])
                          }, M(St.value.message), 3),
                          St.value.stdout || St.value.stderr ? (C(), R("pre", wh, M([St.value.stdout, St.value.stderr].filter(Boolean).join(`
`)), 1)) : W("", !0)
                        ])) : W("", !0),
                        y(m(le), null, {
                          default: S(() => [...r[150] || (r[150] = [
                            _(` Runs as root, mediated by you here in the UI — the container's own "agent" user never gets this capability, so this stays safe even with sudo left off. Good for one-off fixes (a forgotten package) without needing the sudo toggle at all. `, -1)
                          ])]),
                          _: 1
                        })
                      ])
                    ], 64)) : W("", !0)
                  ])) : W("", !0)
                ], 2))), 128))
              ])
            ], 64))
          ])
        ])) : s.value === "config" ? (C(), R("section", kh, [
          f("div", Sh, [
            f("section", Ch, [
              r[166] || (r[166] = f("p", { class: "mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Runtime", -1)),
              r[167] || (r[167] = f("h3", { class: "mb-4 text-base font-semibold" }, "Service", -1)),
              f("div", Ah, [
                y(m(oe), { for: "config-enabled" }, {
                  default: S(() => [...r[152] || (r[152] = [
                    _("Enable Incus", -1)
                  ])]),
                  _: 1
                }),
                y(m(un), {
                  id: "config-enabled",
                  modelValue: v.enabled,
                  "onUpdate:modelValue": r[24] || (r[24] = (d) => v.enabled = d)
                }, null, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[153] || (r[153] = [
                    _(" Starts incusd on array start. Leaving this off keeps the daemon — and its private-prefixed binaries under ", -1),
                    f("span", { class: "font-mono" }, "/usr/local/incus/", -1),
                    _(" — installed but never running. ", -1)
                  ])]),
                  _: 1
                }),
                y(m(oe), { for: "config-dashboard-widget" }, {
                  default: S(() => [...r[154] || (r[154] = [
                    _("Show Dashboard widget", -1)
                  ])]),
                  _: 1
                }),
                y(m(un), {
                  id: "config-dashboard-widget",
                  modelValue: v.dashboardWidgetEnable,
                  "onUpdate:modelValue": r[25] || (r[25] = (d) => v.dashboardWidgetEnable = d)
                }, null, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[155] || (r[155] = [
                    _(" Shows a jail-status box (running/stopped/other counts) on Unraid's Main/Dashboard tab. ", -1)
                  ])]),
                  _: 1
                }),
                y(m(oe), { for: "config-state-dir" }, {
                  default: S(() => [...r[156] || (r[156] = [
                    _("Incus state directory", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-state-dir",
                  modelValue: v.stateDir,
                  "onUpdate:modelValue": r[26] || (r[26] = (d) => v.stateDir = d),
                  class: "w-96 justify-self-end font-mono"
                }, null, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[157] || (r[157] = [
                    _(" Where incusd keeps its database, storage pool, and container state. Must be real persistent storage on the array, not tmpfs — this is the one thing that survives a reboot or plugin update. ", -1)
                  ])]),
                  _: 1
                })
              ]),
              f("div", Eh, [
                r[165] || (r[165] = f("h4", { class: "mb-3 text-sm font-semibold" }, "Storage pool", -1)),
                f("div", Ih, [
                  y(m(oe), { for: "config-storage-driver" }, {
                    default: S(() => [...r[158] || (r[158] = [
                      _("Storage driver", -1)
                    ])]),
                    _: 1
                  }),
                  y(m(Cs), {
                    id: "config-storage-driver",
                    modelValue: v.storageDriver,
                    "onUpdate:modelValue": r[27] || (r[27] = (d) => v.storageDriver = d),
                    class: "w-56 justify-self-end"
                  }, {
                    default: S(() => [...r[159] || (r[159] = [
                      f("option", { value: "dir" }, "dir (simple, no pool required)", -1),
                      f("option", { value: "zfs" }, "zfs (snapshots/speed, needs existing pool)", -1)
                    ])]),
                    _: 1
                  }, 8, ["modelValue"]),
                  y(m(le), { class: "col-span-2" }, {
                    default: S(() => [...r[160] || (r[160] = [
                      f("span", { class: "font-mono" }, "dir", -1),
                      _(" needs no existing pool and always works — it's the default for exactly that reason. ", -1),
                      f("span", { class: "font-mono" }, "zfs", -1),
                      _(" gets snapshots and speed, but the pool or dataset must already exist on your system; there's no safe way to auto-create one on your array. ", -1)
                    ])]),
                    _: 1
                  }),
                  Ce.value ? (C(), R(ue, { key: 0 }, [
                    y(m(oe), { for: "config-storage-source" }, {
                      default: S(() => [...r[161] || (r[161] = [
                        _("ZFS pool/dataset", -1)
                      ])]),
                      _: 1
                    }),
                    y(m(he), {
                      id: "config-storage-source",
                      modelValue: v.storageSource,
                      "onUpdate:modelValue": r[28] || (r[28] = (d) => v.storageSource = d),
                      class: "w-96 justify-self-end font-mono"
                    }, null, 8, ["modelValue"]),
                    y(m(le), { class: "col-span-2" }, {
                      default: S(() => [...r[162] || (r[162] = [
                        _(" An existing pool or dataset path, e.g. ", -1),
                        f("span", { class: "font-mono" }, "nvme/incus", -1),
                        _(". A dataset under this path is created if missing, but the pool itself must already exist. ", -1)
                      ])]),
                      _: 1
                    })
                  ], 64)) : W("", !0),
                  y(m(oe), { for: "config-storage-pool" }, {
                    default: S(() => [...r[163] || (r[163] = [
                      _("Incus storage pool name", -1)
                    ])]),
                    _: 1
                  }),
                  y(m(he), {
                    id: "config-storage-pool",
                    modelValue: v.storagePoolName,
                    "onUpdate:modelValue": r[29] || (r[29] = (d) => v.storagePoolName = d),
                    class: "w-48 justify-self-end font-mono"
                  }, null, 8, ["modelValue"]),
                  y(m(le), { class: "col-span-2" }, {
                    default: S(() => [...r[164] || (r[164] = [
                      _(" The name Incus itself uses for this storage pool internally — cosmetic, doesn't need to match anything else on the host. ", -1)
                    ])]),
                    _: 1
                  })
                ])
              ])
            ]),
            f("section", Th, [
              r[193] || (r[193] = f("p", { class: "mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Network & Access", -1)),
              r[194] || (r[194] = f("h3", { class: "mb-4 text-base font-semibold" }, "Network & ACL (LAN-ban)", -1)),
              r[195] || (r[195] = f("p", { class: "mb-4 text-xs text-muted-foreground" }, " Controls the bridge/subnet containers attach to and the firewall rules governing what they can reach. ", -1)),
              f("div", Ph, [
                y(m(oe), { for: "config-bridge" }, {
                  default: S(() => [...r[168] || (r[168] = [
                    _("Container bridge", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-bridge",
                  modelValue: v.jailBridge,
                  "onUpdate:modelValue": r[30] || (r[30] = (d) => v.jailBridge = d),
                  class: "w-48 justify-self-end font-mono"
                }, null, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[169] || (r[169] = [
                    _(" A dedicated NAT bridge name for containers, kept separate from Unraid's own br0 so container traffic never touches host networking directly. ", -1)
                  ])]),
                  _: 1
                }),
                y(m(oe), { for: "config-subnet" }, {
                  default: S(() => [...r[170] || (r[170] = [
                    _("Container subnet", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-subnet",
                  modelValue: v.jailSubnet,
                  "onUpdate:modelValue": r[31] || (r[31] = (d) => v.jailSubnet = d),
                  class: "w-48 justify-self-end font-mono"
                }, null, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[171] || (r[171] = [
                    _(" CIDR for the bridge. Defaults to an RFC 2544 benchmark range specifically because it won't collide with a typical home or office LAN. ", -1)
                  ])]),
                  _: 1
                }),
                y(m(oe), { for: "config-nat" }, {
                  default: S(() => [...r[172] || (r[172] = [
                    _("NAT", -1)
                  ])]),
                  _: 1
                }),
                y(m(un), {
                  id: "config-nat",
                  modelValue: v.jailNat,
                  "onUpdate:modelValue": r[32] || (r[32] = (d) => v.jailNat = d)
                }, null, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[173] || (r[173] = [
                    _(" Routes container traffic to the Internet through the host. Turning this off isolates containers with no outbound access at all — no Internet, no LAN. ", -1)
                  ])]),
                  _: 1
                }),
                y(m(oe), { for: "config-ipv6" }, {
                  default: S(() => [...r[174] || (r[174] = [
                    _("IPv6", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-ipv6",
                  "model-value": "none",
                  disabled: "",
                  readonly: "",
                  "aria-describedby": "config-ipv6-policy",
                  class: "w-48 justify-self-end font-mono"
                }),
                y(m(le), {
                  id: "config-ipv6-policy",
                  class: "col-span-2"
                }, {
                  default: S(() => [...r[175] || (r[175] = [
                    _(" Fixed to ", -1),
                    f("span", { class: "font-mono" }, "none", -1),
                    _(": IPv6 is deliberately fail-closed until the plugin can enforce isolation equivalent to the IPv4 ACL policy. Containers cannot enable it from this page. ", -1)
                  ])]),
                  _: 1
                }),
                y(m(oe), { for: "config-acl-name" }, {
                  default: S(() => [...r[176] || (r[176] = [
                    _("ACL name", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-acl-name",
                  modelValue: v.aclName,
                  "onUpdate:modelValue": r[33] || (r[33] = (d) => v.aclName = d),
                  class: "w-48 justify-self-end font-mono"
                }, null, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[177] || (r[177] = [
                    _(" The name of the Incus network ACL that enforces the LAN ban — created and applied to the bridge by the array-start init script. ", -1)
                  ])]),
                  _: 1
                }),
                y(m(oe), { for: "config-egress" }, {
                  default: S(() => [...r[178] || (r[178] = [
                    _("Default egress action", -1)
                  ])]),
                  _: 1
                }),
                y(m(Cs), {
                  id: "config-egress",
                  modelValue: v.aclDefaultEgress,
                  "onUpdate:modelValue": r[34] || (r[34] = (d) => v.aclDefaultEgress = d),
                  class: "w-32 justify-self-end"
                }, {
                  default: S(() => [...r[179] || (r[179] = [
                    f("option", { value: "allow" }, "allow", -1),
                    f("option", { value: "drop" }, "drop", -1)
                  ])]),
                  _: 1
                }, 8, ["modelValue"]),
                y(m(oe), { for: "config-ingress" }, {
                  default: S(() => [...r[180] || (r[180] = [
                    _("Default ingress action", -1)
                  ])]),
                  _: 1
                }),
                y(m(Cs), {
                  id: "config-ingress",
                  modelValue: v.aclDefaultIngress,
                  "onUpdate:modelValue": r[35] || (r[35] = (d) => v.aclDefaultIngress = d),
                  class: "w-32 justify-self-end"
                }, {
                  default: S(() => [...r[181] || (r[181] = [
                    f("option", { value: "allow" }, "allow", -1),
                    f("option", { value: "drop" }, "drop", -1)
                  ])]),
                  _: 1
                }, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[182] || (r[182] = [
                    _(" What happens to traffic not covered by a rule above. Egress defaults to allow (deny-list model — Internet stays reachable unless explicitly blocked); ingress defaults to drop (nothing reaches a container unsolicited). Tailscale's CGNAT range (100.64.0.0/10) is blocked by default; add only the narrow allow-hole a container genuinely needs rather than exposing the whole tailnet. ", -1)
                  ])]),
                  _: 1
                })
              ]),
              f("div", Rh, [
                y(m(oe), {
                  for: "new-blocked-cidr",
                  class: "mb-1.5 block"
                }, {
                  default: S(() => [...r[183] || (r[183] = [
                    _("Blocked CIDRs (deny-list)", -1)
                  ])]),
                  _: 1
                }),
                Bs.value.length > 0 ? (C(), R("div", Mh, [
                  (C(!0), R(ue, null, Qe(Bs.value, (d) => (C(), R("span", {
                    key: d,
                    class: "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs"
                  }, [
                    _(M(d) + " ", 1),
                    f("button", {
                      type: "button",
                      "aria-label": `Remove blocked CIDR ${d}`,
                      class: "cursor-pointer text-muted-foreground hover:text-destructive",
                      onClick: ($) => ga(d)
                    }, "✕", 8, $h)
                  ]))), 128))
                ])) : W("", !0),
                f("div", Vh, [
                  y(m(he), {
                    id: "new-blocked-cidr",
                    modelValue: Hs.value,
                    "onUpdate:modelValue": r[36] || (r[36] = (d) => Hs.value = d),
                    class: "w-full font-mono",
                    placeholder: "e.g. 10.0.0.0/8",
                    onKeydown: pn(fn(Vr, ["prevent"]), ["enter"])
                  }, null, 8, ["modelValue", "onKeydown"]),
                  y(m(fe), {
                    size: "sm",
                    variant: "outline",
                    disabled: !Hs.value.trim(),
                    onClick: Vr
                  }, {
                    default: S(() => [...r[184] || (r[184] = [
                      _("Add", -1)
                    ])]),
                    _: 1
                  }, 8, ["disabled"])
                ]),
                Ws.value ? (C(), R("p", Oh, M(Ws.value), 1)) : W("", !0),
                y(m(le), null, {
                  default: S(() => [...r[185] || (r[185] = [
                    _(" Ranges containers may not reach — this is the actual LAN ban. Add one CIDR at a time; defaults to the private IPv4 ranges (RFC 1918) plus link-local addresses. ", -1)
                  ])]),
                  _: 1
                })
              ]),
              f("div", jh, [
                y(m(oe), {
                  for: "new-allow-cidr",
                  class: "mb-1.5 block"
                }, {
                  default: S(() => [...r[186] || (r[186] = [
                    _("Allow-holes (punched before block rules)", -1)
                  ])]),
                  _: 1
                }),
                Fs.value.length > 0 ? (C(), R("div", Nh, [
                  (C(!0), R(ue, null, Qe(Fs.value, (d) => (C(), R("span", {
                    key: d,
                    class: "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs"
                  }, [
                    _(M(d) + " ", 1),
                    f("button", {
                      type: "button",
                      "aria-label": `Remove allowed CIDR ${d}`,
                      class: "cursor-pointer text-muted-foreground hover:text-destructive",
                      onClick: ($) => ha(d)
                    }, "✕", 8, Lh)
                  ]))), 128))
                ])) : W("", !0),
                f("div", Uh, [
                  y(m(he), {
                    id: "new-allow-cidr",
                    modelValue: zs.value,
                    "onUpdate:modelValue": r[37] || (r[37] = (d) => zs.value = d),
                    class: "w-full font-mono",
                    placeholder: "e.g. 100.64.0.0/10",
                    onKeydown: pn(fn(Or, ["prevent"]), ["enter"])
                  }, null, 8, ["modelValue", "onKeydown"]),
                  y(m(fe), {
                    size: "sm",
                    variant: "outline",
                    disabled: !zs.value.trim(),
                    onClick: Or
                  }, {
                    default: S(() => [...r[187] || (r[187] = [
                      _("Add", -1)
                    ])]),
                    _: 1
                  }, 8, ["disabled"])
                ]),
                qs.value ? (C(), R("p", Dh, M(qs.value), 1)) : W("", !0),
                y(m(le), null, {
                  default: S(() => [...r[188] || (r[188] = [
                    _(" Exceptions punched through the block list before it's evaluated — e.g. one specific internal service (a local LLM, a search index) a container legitimately needs to reach. ", -1)
                  ])]),
                  _: 1
                })
              ]),
              f("div", Bh, [
                r[191] || (r[191] = f("h4", { class: "mb-3 text-sm font-semibold" }, "Tailscale", -1)),
                r[192] || (r[192] = f("p", { class: "mb-4 text-xs text-muted-foreground" }, " Optional — when set, new containers automatically join your tailnet using this key. ", -1)),
                f("div", Fh, [
                  y(m(oe), { for: "tailscale-auth-key" }, {
                    default: S(() => [...r[189] || (r[189] = [
                      _("Tailscale auth key", -1)
                    ])]),
                    _: 1
                  }),
                  f("div", Hh, [
                    y(m(he), {
                      id: "tailscale-auth-key",
                      modelValue: ne.value,
                      "onUpdate:modelValue": r[38] || (r[38] = (d) => ne.value = d),
                      type: de.value ? "text" : "password",
                      class: "w-72 font-mono",
                      placeholder: v.tsAuthKeyConfigured ? "Configured — enter a replacement" : "tskey-auth-…"
                    }, null, 8, ["modelValue", "type", "placeholder"]),
                    y(m(fe), {
                      size: "sm",
                      variant: "outline",
                      onClick: r[39] || (r[39] = (d) => de.value = !de.value)
                    }, {
                      default: S(() => [
                        _(M(de.value ? "Hide" : "Show"), 1)
                      ]),
                      _: 1
                    }),
                    v.tsAuthKeyConfigured ? (C(), Ie(m(fe), {
                      key: 0,
                      size: "sm",
                      variant: "outline",
                      onClick: r[40] || (r[40] = (d) => Ae.value = !Ae.value)
                    }, {
                      default: S(() => [
                        _(M(Ae.value ? "Keep key" : "Clear on save"), 1)
                      ]),
                      _: 1
                    })) : W("", !0)
                  ]),
                  y(m(le), { class: "col-span-2" }, {
                    default: S(() => [...r[190] || (r[190] = [
                      _(" The stored key is write-only and is never returned to this page. A reusable or ephemeral key from your Tailscale admin console. Best-effort: if a container's image doesn't have Tailscale installed, joining is silently skipped rather than failing the launch — it never blocks a container from starting. ", -1)
                    ])]),
                    _: 1
                  })
                ])
              ])
            ]),
            f("section", zh, [
              r[214] || (r[214] = f("p", { class: "mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Container Defaults", -1)),
              r[215] || (r[215] = f("h3", { class: "mb-4 text-base font-semibold" }, "Defaults", -1)),
              f("div", Wh, [
                y(m(oe), { for: "config-profile" }, {
                  default: S(() => [...r[196] || (r[196] = [
                    _("Container profile", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-profile",
                  modelValue: v.jailProfile,
                  "onUpdate:modelValue": r[41] || (r[41] = (d) => v.jailProfile = d),
                  class: "w-48 justify-self-end font-mono"
                }, null, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[197] || (r[197] = [
                    _(" The Incus profile new containers launch with — sets resource limits, network, and mounts, defined in the array-start init script's profile template. ", -1)
                  ])]),
                  _: 1
                }),
                y(m(oe), { for: "config-image" }, {
                  default: S(() => [...r[198] || (r[198] = [
                    _("Default image", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-image",
                  modelValue: v.jailImage,
                  "onUpdate:modelValue": r[42] || (r[42] = (d) => v.jailImage = d),
                  class: "w-96 justify-self-end font-mono"
                }, null, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[199] || (r[199] = [
                    _(" Used when launching a container without picking a specific image — either a remote reference like ", -1),
                    f("span", { class: "font-mono" }, "images:debian/trixie/cloud", -1),
                    _(", or a locally-built image's alias. Marking an image as the golden master in the Builder tab sets this automatically. ", -1)
                  ])]),
                  _: 1
                }),
                y(m(oe), { for: "config-nesting" }, {
                  default: S(() => [...r[200] || (r[200] = [
                    _("Allow nesting", -1)
                  ])]),
                  _: 1
                }),
                y(m(un), {
                  id: "config-nesting",
                  modelValue: v.jailNesting,
                  "onUpdate:modelValue": r[43] || (r[43] = (d) => v.jailNesting = d)
                }, null, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[201] || (r[201] = [
                    _(" Lets a container run Docker or Incus inside itself — needed for agents that spin up their own sandboxes, but widens what a compromised container could reach. ", -1)
                  ])]),
                  _: 1
                }),
                y(m(oe), { for: "config-cpu" }, {
                  default: S(() => [...r[202] || (r[202] = [
                    _("CPU limit", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-cpu",
                  modelValue: v.jailCpu,
                  "onUpdate:modelValue": r[44] || (r[44] = (d) => v.jailCpu = d),
                  class: "w-24 justify-self-end font-mono",
                  placeholder: "empty = no cap"
                }, null, 8, ["modelValue"]),
                g.value ? (C(), R("p", qh, M(g.value), 1)) : W("", !0),
                y(m(oe), { for: "config-memory" }, {
                  default: S(() => [...r[203] || (r[203] = [
                    _("Memory limit", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-memory",
                  modelValue: v.jailMemory,
                  "onUpdate:modelValue": r[45] || (r[45] = (d) => v.jailMemory = d),
                  class: "w-24 justify-self-end font-mono",
                  placeholder: "empty = no cap"
                }, null, 8, ["modelValue"]),
                x.value ? (C(), R("p", Kh, M(x.value), 1)) : W("", !0),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[204] || (r[204] = [
                    _(" Hard resource ceiling applied via the container profile at launch — CPU as a core count (e.g. ", -1),
                    f("span", { class: "font-mono" }, "2", -1),
                    _("), memory with a unit (e.g. ", -1),
                    f("span", { class: "font-mono" }, "4GiB", -1),
                    _("). Leave either empty for no cap. ", -1)
                  ])]),
                  _: 1
                }),
                y(m(oe), { for: "config-workspace" }, {
                  default: S(() => [...r[205] || (r[205] = [
                    _("Workspace root", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-workspace",
                  modelValue: v.jailWorkspaceRoot,
                  "onUpdate:modelValue": r[46] || (r[46] = (d) => v.jailWorkspaceRoot = d),
                  class: "w-96 justify-self-end font-mono"
                }, null, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[206] || (r[206] = [
                    _(` Host directory holding per-container workspaces, bind-mounted in with idmap shifting. Must be real persistent storage — the init script refuses to start if it's tmpfs, since that would silently lose "persistent" data on every reboot. Prefer a real device mount (e.g. `, -1),
                    f("span", { class: "font-mono" }, "/mnt/cache/appdata/...", -1),
                    _(") over a ", -1),
                    f("span", { class: "font-mono" }, "/mnt/user/...", -1),
                    _(" path — Unraid's shfs FUSE union view generally doesn't support the idmapped-mount feature the shift needs. ", -1)
                  ])]),
                  _: 1
                }),
                y(m(oe), { for: "config-agent-uid" }, {
                  default: S(() => [...r[207] || (r[207] = [
                    _("Agent UID", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-agent-uid",
                  modelValue: v.jailAgentUid,
                  "onUpdate:modelValue": r[47] || (r[47] = (d) => v.jailAgentUid = d),
                  class: "w-24 justify-self-end font-mono"
                }, null, 8, ["modelValue"]),
                y(m(oe), { for: "config-agent-gid" }, {
                  default: S(() => [...r[208] || (r[208] = [
                    _("Agent GID", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-agent-gid",
                  modelValue: v.jailAgentGid,
                  "onUpdate:modelValue": r[48] || (r[48] = (d) => v.jailAgentGid = d),
                  class: "w-24 justify-self-end font-mono"
                }, null, 8, ["modelValue"]),
                y(m(le), { class: "col-span-2" }, {
                  default: S(() => [...r[209] || (r[209] = [
                    _(" The uid/gid inside each container mapped to your host user — match your own host user if you want files under the bind-mounted workspace to show correct ownership from outside the container. ", -1)
                  ])]),
                  _: 1
                })
              ]),
              f("div", Gh, [
                r[212] || (r[212] = f("h4", { class: "mb-3 text-sm font-semibold" }, "Bind mounts", -1)),
                y(m(oe), {
                  for: "config-bind-mounts",
                  class: "mb-2 block"
                }, {
                  default: S(() => [...r[210] || (r[210] = [
                    _("Host config bind-mounts", -1)
                  ])]),
                  _: 1
                }),
                y(m(he), {
                  id: "config-bind-mounts",
                  modelValue: v.jailBindMounts,
                  "onUpdate:modelValue": r[49] || (r[49] = (d) => v.jailBindMounts = d),
                  class: "w-full font-mono",
                  placeholder: "/boot/config/plugins/incus/bind-mounts/claude:/home/agent/.claude:ro"
                }, null, 8, ["modelValue"]),
                r[213] || (r[213] = f("p", { class: "mt-2 text-xs text-muted-foreground" }, " Comma-separated host:container[:ro|rw] triples from approved roots. Mounts default to read-only; only sources beneath the workspace root may be writable. ", -1)),
                y(m(le), null, {
                  default: S(() => [...r[211] || (r[211] = [
                    _(" Copy curated agent config under ", -1),
                    f("span", { class: "font-mono" }, "/boot/config/plugins/incus/bind-mounts", -1),
                    _(" rather than exposing host home or system paths. Sources must resolve beneath that directory or the configured workspace root; config-root mounts are always read-only. ", -1)
                  ])]),
                  _: 1
                })
              ])
            ])
          ]),
          f("div", Jh, [
            y(m(fe), {
              disabled: o.value || !!g.value || !!x.value,
              onClick: ko
            }, {
              default: S(() => [
                _(M(o.value ? "Applying…" : "Apply"), 1)
              ]),
              _: 1
            }, 8, ["disabled"])
          ])
        ])) : W("", !0)
      ], 64)),
      O.value ? (C(), Ie(m(t), {
        key: 2,
        "jail-name": O.value,
        onClose: r[50] || (r[50] = (d) => O.value = null)
      }, null, 8, ["jail-name"])) : W("", !0)
    ]));
  }
}), Xh = /* @__PURE__ */ vc(Zh, { shadowRoot: !1 });
customElements.get("incus-settings-app") || customElements.define("incus-settings-app", Xh);
export {
  fe as _,
  ki as a,
  C as b,
  R as c,
  We as d,
  f as e,
  Dd as f,
  _n as g,
  y as h,
  _ as i,
  W as j,
  pe as k,
  Pn as n,
  _i as o,
  N as r,
  M as t,
  m as u,
  S as w
};
