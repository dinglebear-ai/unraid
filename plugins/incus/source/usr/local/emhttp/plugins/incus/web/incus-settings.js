import { $ as e, A as t, B as n, C as r, D as i, E as a, F as o, G as s, H as c, I as l, J as u, K as d, L as f, M as p, N as m, O as h, P as g, Q as _, R as v, S as y, T as ee, U as b, V as te, W as x, X as ne, Y as re, Z as S, _ as C, a as ie, at as w, b as ae, c as oe, ct as se, d as T, dt as E, et as ce, f as D, ft as le, g as O, h as ue, i as de, it as fe, j as pe, k as me, l as k, lt as he, m as ge, n as _e, nt as ve, o as A, ot as ye, p as j, pt as be, q as xe, r as M, rt as Se, s as Ce, st as we, t as N, tt as Te, u as P, ut as Ee, v as De, w as Oe, x as ke, y as F, z as Ae } from "./incus-settings-graphql-client-LuoElzcT.js";
// node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js
var je = void 0, I = typeof window < "u" && window.trustedTypes;
if (I) try {
	je = /* @__PURE__ */ I.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var Me = je ? (e) => je.createHTML(e) : (e) => e, Ne = "http://www.w3.org/2000/svg", Pe = "http://www.w3.org/1998/Math/MathML", L = typeof document < "u" ? document : null, Fe = L && /* @__PURE__ */ L.createElement("template"), Ie = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? L.createElementNS(Ne, e) : t === "mathml" ? L.createElementNS(Pe, e) : n ? L.createElement(e, { is: n }) : L.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => L.createTextNode(e),
	createComment: (e) => L.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => L.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), i !== a && (i = i.nextSibling););
		else {
			Fe.innerHTML = Me(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = Fe.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, R = /* @__PURE__ */ Symbol("_vtc");
function z(e, t, n) {
	let r = e[R];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var B = /* @__PURE__ */ Symbol("_vod"), Le = /* @__PURE__ */ Symbol("_vsh"), V = /* @__PURE__ */ Symbol(""), Re = /(?:^|;)\s*display\s*:/;
function ze(e, t, n) {
	let r = e.style, i = fe(n), a = !1;
	if (n && !i) {
		if (t) {
			if (fe(t)) for (let e of t.split(";")) {
				let t = e.slice(0, e.indexOf(":")).trim();
				n[t] ?? Ve(r, t, "");
			}
			else for (let e in t) n[e] ?? Ve(r, e, "");
		}
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? Ve(r, i, "") : Ge(e, i, !fe(t) && t ? t[i] : void 0, o) || Ve(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[V];
			e && (n += ";" + e), r.cssText = n, a = Re.test(n);
		}
	} else t && e.removeAttribute("style");
	B in e && (i && t === n || (e[B] = a ? r.display : ""), e[Le] && (r.display = "none"));
}
var Be = /\s*!important$/;
function Ve(e, t, n) {
	if (S(n)) n.forEach((n) => Ve(e, t, n));
	else if (n ??= "", t.startsWith("--")) Be.test(n) ? e.setProperty(t, n.replace(Be, ""), "important") : e.setProperty(t, n);
	else {
		let r = We(e, t);
		Be.test(n) ? e.setProperty(u(r), n.replace(Be, ""), "important") : e[r] = n;
	}
}
var He = [
	"Webkit",
	"Moz",
	"ms"
], Ue = {};
function We(e, t) {
	let n = Ue[t];
	if (n) return n;
	let r = x(t);
	if (r !== "filter" && r in e) return Ue[t] = r;
	r = s(r);
	for (let n = 0; n < He.length; n++) {
		let i = He[n] + r;
		if (i in e) return Ue[t] = i;
	}
	return t;
}
function Ge(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && fe(r) && n === r;
}
var Ke = "http://www.w3.org/1999/xlink";
function qe(e, t, n, r, i, a = Se(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Ke, t.slice(6, t.length)) : e.setAttributeNS(Ke, t, n) : n == null || a && !re(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : w(n) ? String(n) : n);
}
function Je(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? Me(n) : n);
		return;
	}
	let a = e.tagName;
	if (t === "value" && a !== "PROGRESS" && !a.includes("-")) {
		let r = a === "OPTION" ? e.getAttribute("value") || "" : e.value, i = n == null ? e.type === "checkbox" ? "on" : "" : String(n);
		r === i && "_value" in e || (e.value = i), n ?? e.removeAttribute(t), e._value = n;
		return;
	}
	let o = !1;
	if (n === "" || n == null) {
		let r = typeof e[t];
		r === "boolean" ? n = re(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
	}
	try {
		e[t] = n;
	} catch {}
	o && e.removeAttribute(i || t);
}
function H(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function Ye(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var Xe = /* @__PURE__ */ Symbol("_vei");
function Ze(e, t, n, r, i = null) {
	let a = e[Xe] || (e[Xe] = {}), o = a[t];
	if (r && o) o.value = r;
	else {
		let [n, s] = et(t);
		r ? H(e, n, a[t] = it(r, i), s) : o && (Ye(e, n, o, s), a[t] = void 0);
	}
}
var Qe = /(Once|Passive|Capture)$/, $e = /^on:?(?:Once|Passive|Capture)$/;
function et(e) {
	let t, n;
	for (; (n = e.match(Qe)) && !$e.test(e);) t ||= {}, e = e.slice(0, e.length - n[1].length), t[n[1].toLowerCase()] = !0;
	return [e[2] === ":" ? e.slice(3) : u(e.slice(2)), t];
}
var tt = 0, nt = /* @__PURE__ */ Promise.resolve(), rt = () => tt ||= (nt.then(() => tt = 0), Date.now());
function it(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		let r = n.value;
		if (S(r)) {
			let n = e.stopImmediatePropagation;
			e.stopImmediatePropagation = () => {
				n.call(e), e._stopped = !0;
			};
			let i = r.slice(), a = [e];
			for (let n = 0; n < i.length && !e._stopped; n++) {
				let e = i[n];
				e && Ce(e, t, 5, a);
			}
		} else Ce(r, t, 5, [e]);
	};
	return n.value = e, n.attached = rt(), n;
}
var at = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, ot = (t, n, r, i, a, o) => {
	let s = a === "svg";
	n === "class" ? z(t, i, s) : n === "style" ? ze(t, r, i) : ce(n) ? e(n) || Ze(t, n, r, i, o) : (n[0] === "." ? (n = n.slice(1), 1) : n[0] === "^" ? (n = n.slice(1), 0) : U(t, n, i, s)) ? (Je(t, n, i), t.tagName.includes("-") || n !== "value" && n !== "checked" && n !== "selected" || qe(t, n, i, s, o, n !== "value")) : t._isVueCE && (st(t, n) || t._def.__asyncLoader && (/[A-Z]/.test(n) || !fe(i))) ? Je(t, x(n), i, o, n) : (n === "true-value" ? t._trueValue = i : n === "false-value" && (t._falseValue = i), qe(t, n, i, s));
};
function U(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && at(t) && _(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return at(t) && fe(n) ? !1 : t in e;
}
function st(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = x(t);
	return Array.isArray(n) ? n.some((e) => x(e) === r) : Object.keys(n).some((e) => x(e) === r);
}
var ct = {};
// @__NO_SIDE_EFFECTS__
function lt(e, t, n) {
	let r = F(e, t);
	Te(r) && (r = d({}, r, t));
	class i extends dt {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var ut = typeof HTMLElement < "u" ? HTMLElement : class {}, dt = class e extends ut {
	constructor(e, t = {}, n = Lt) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== Lt ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(d({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
	}
	connectedCallback() {
		if (!this.isConnected) return;
		!this.shadowRoot && !this._resolved && this._parseSlots(), this._connected = !0;
		let t = this;
		for (; t &&= t.assignedSlot || t.parentNode || t.host;) if (t instanceof e) {
			this._parent = t;
			break;
		}
		this._instance || (this._resolved ? this._mount(this._def) : t && t._pendingResolve ? this._pendingResolve = t._pendingResolve.then(() => {
			if (this._pendingResolve = void 0, this.isConnected) return this._resolveDef();
		}) : this._resolveDef());
	}
	_setParent(e = this._parent) {
		e && (this._instance.parent = e._instance, this._inheritParentContext(e));
	}
	_inheritParentContext(e = this._parent) {
		e && this._app && Object.setPrototypeOf(this._app._context.provides, e._instance.provides);
	}
	disconnectedCallback() {
		this._connected = !1, Oe(() => {
			this._connected || (this._ob &&= (this._ob.disconnect(), null), this._app && this._app.unmount(), this._instance && (this._instance.ce = void 0), this._app = this._instance = null, this._teleportTargets &&= (this._teleportTargets.clear(), void 0));
		});
	}
	_processMutations(e) {
		for (let t of e) this._setAttr(t.attributeName);
	}
	_resolveDef() {
		if (this._pendingResolve) return this._pendingResolve;
		for (let e = 0; e < this.attributes.length; e++) this._setAttr(this.attributes[e].name);
		this._ob = new MutationObserver(this._processMutations.bind(this)), this._ob.observe(this, { attributes: !0 });
		let e = (e, t = !1) => {
			this._resolved = !0, this._pendingResolve = void 0;
			let { props: n, styles: r } = e, i;
			if (n && !S(n)) for (let e in n) {
				let t = n[e];
				(t === Number || t && t.type === Number) && (e in this._props && (this._props[e] = be(this._props[e])), (i ||= /* @__PURE__ */ Object.create(null))[x(e)] = !0);
			}
			this._numberProps = i, this._resolveProps(e), this.shadowRoot && this._applyStyles(r), this._connected && this._mount(e);
		}, t = this._def.__asyncLoader;
		if (t) return this._pendingResolve = t().then((t) => {
			t.configureApp = this._def.configureApp, e(this._def = t, !0);
		}), this._pendingResolve;
		e(this._def);
	}
	_mount(e) {
		this._app = this._createApp(e), this._inheritParentContext(), e.configureApp && e.configureApp(this._app), this._app._ceVNode = this._createVNode(), this._app.mount(this._root);
		let t = this._instance && this._instance.exposed;
		if (t) for (let e in t) xe(this, e) || Object.defineProperty(this, e, { get: () => b(t[e]) });
	}
	_resolveProps(e) {
		let { props: t } = e, n = S(t) ? t : Object.keys(t || {});
		for (let e of Object.keys(this)) e[0] !== "_" && n.includes(e) && this._setProp(e, this[e]);
		for (let e of n.map(x)) Object.defineProperty(this, e, {
			get() {
				return this._getProp(e);
			},
			set(t) {
				this._setProp(e, t, !0, !this._patching);
			}
		});
	}
	_setAttr(e) {
		if (e.startsWith("data-v-")) return;
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : ct, r = x(e);
		t && this._numberProps && this._numberProps[r] && (n = be(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === ct ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(u(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(u(e), t + "") : t || this.removeAttribute(u(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), It(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = C(this._def, d(e, this._props));
		return this._instance || (t.ce = (e) => {
			this._instance = e, e.ce = this, e.isCE = !0;
			let t = (e, t) => {
				this.dispatchEvent(new CustomEvent(e, Te(t[0]) ? d({ detail: t }, t[0]) : { detail: t }));
			};
			e.emit = (e, ...n) => {
				t(e, n), u(e) !== e && t(u(e), n);
			}, this._setParent();
		}), t;
	}
	_applyStyles(e, t, n) {
		if (!e) return;
		if (t) {
			if (t === this._def || this._styleChildren.has(t)) return;
			this._styleChildren.add(t);
		}
		let r = this._nonce, i = this.shadowRoot, a = n ? this._getStyleAnchor(n) || this._getStyleAnchor(this._def) : this._getRootStyleInsertionAnchor(i), o = null;
		for (let s = e.length - 1; s >= 0; s--) {
			let c = document.createElement("style");
			r && c.setAttribute("nonce", r), c.textContent = e[s], i.insertBefore(c, o || a), o = c, s === 0 && (n || this._styleAnchors.set(this._def, c), t && this._styleAnchors.set(t, c));
		}
	}
	_getStyleAnchor(e) {
		if (!e) return null;
		let t = this._styleAnchors.get(e);
		return t && t.parentNode === this.shadowRoot ? t : (t && this._styleAnchors.delete(e), null);
	}
	_getRootStyleInsertionAnchor(e) {
		for (let t = 0; t < e.childNodes.length; t++) {
			let n = e.childNodes[t];
			if (!(n instanceof HTMLStyleElement)) return n;
		}
		return null;
	}
	_parseSlots() {
		let e = this._slots = {}, t;
		for (; t = this.firstChild;) {
			let n = t.nodeType === 1 && t.getAttribute("slot") || "default";
			(e[n] || (e[n] = [])).push(t), this.removeChild(t);
		}
	}
	_renderSlots() {
		let e = this._getSlots(), t = this._instance.type.__scopeId;
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = r.getAttribute("name") || "default", a = this._slots[i], o = r.parentNode;
			if (a) for (let e of a) {
				if (t && e.nodeType === 1) {
					let n = t + "-s", r = document.createTreeWalker(e, 1);
					e.setAttribute(n, "");
					let i;
					for (; i = r.nextNode();) i.setAttribute(n, "");
				}
				o.insertBefore(e, r);
			}
			else for (; r.firstChild;) o.insertBefore(r.firstChild, r);
			o.removeChild(r);
		}
	}
	_getSlots() {
		let e = [this];
		this._teleportTargets && e.push(...this._teleportTargets);
		let t = /* @__PURE__ */ new Set();
		for (let n of e) {
			let e = n.querySelectorAll("slot");
			for (let n = 0; n < e.length; n++) t.add(e[n]);
		}
		return Array.from(t);
	}
	_injectChildStyle(e, t) {
		this._applyStyles(e.styles, e, t);
	}
	_beginPatch() {
		this._patching = !0, this._dirty = !1;
	}
	_endPatch() {
		this._patching = !1, this._dirty && this._instance && this._update();
	}
	_hasShadowRoot() {
		return this._def.shadowRoot !== !1;
	}
	_removeChildStyle(e) {}
}, ft = (e) => {
	let t = e.props["onUpdate:modelValue"] || !1;
	return S(t) ? (e) => ne(t, e) : t;
};
function pt(e) {
	e.target.composing = !0;
}
function mt(e) {
	let t = e.target;
	t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
var W = /* @__PURE__ */ Symbol("_assign"), ht = /* @__PURE__ */ Symbol("_initialValue");
function gt(e, t, n) {
	return t && (e = e.trim()), n && (e = se(e)), e;
}
var _t = {
	created(e, { modifiers: { lazy: t, trim: n, number: r } }, i) {
		e.parentNode && (e.type === "text" ? e[ht] = e.defaultValue.replace(/[\r\n]/g, "") : e.type === "textarea" && (e[ht] = e.defaultValue.replace(/\r\n?/g, "\n"))), e[W] = ft(i);
		let a = r || i.props && i.props.type === "number";
		H(e, t ? "change" : "input", (t) => {
			t.target.composing || e[W](gt(e.value, n, a));
		}), (n || a) && H(e, "change", () => {
			e.value = gt(e.value, n, a);
		}), t || (H(e, "compositionstart", pt), H(e, "compositionend", mt), H(e, "change", mt));
	},
	mounted(e, { value: t, modifiers: { trim: n, number: r } }) {
		let i = t ?? "", a = e[ht];
		delete e[ht], a !== void 0 && (e.type === "text" || e.type === "textarea") && e.value !== a ? e[W](gt(e.value, n, r)) : e.value = i;
	},
	beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: r, trim: i, number: a } }, o) {
		if (e[W] = ft(o), e.composing) return;
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? se(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, vt = {
	deep: !0,
	created(e, t, n) {
		e[W] = ft(n), H(e, "change", () => {
			let t = e._modelValue, n = G(e), r = e.checked, i = e[W];
			if (S(t)) {
				let e = we(t, n), a = e !== -1;
				if (r && !a) i(t.concat(n));
				else if (!r && a) {
					let n = [...t];
					n.splice(e, 1), i(n);
				}
			} else if (ve(t)) {
				let e = new Set(t);
				r ? e.add(n) : e.delete(n), i(e);
			} else i(wt(e, r));
		});
	},
	mounted: yt,
	beforeUpdate(e, t, n) {
		e[W] = ft(n), yt(e, t, n);
	}
};
function yt(e, { value: t, oldValue: n }, r) {
	e._modelValue = t;
	let i;
	if (S(t)) i = we(t, r.props.value) > -1;
	else if (ve(t)) i = t.has(r.props.value);
	else {
		if (t === n) return;
		i = ye(t, wt(e, !0));
	}
	e.checked !== i && (e.checked = i);
}
var bt = {
	created(e, { value: t }, n) {
		e.checked = ye(t, n.props.value), e[W] = ft(n), H(e, "change", () => {
			e[W](G(e));
		});
	},
	beforeUpdate(e, { value: t, oldValue: n }, r) {
		e[W] = ft(r), t !== n && (e.checked = ye(t, r.props.value));
	}
}, xt = {
	deep: !0,
	created(e, { value: t, modifiers: { number: n } }, r) {
		e._modelValue = t, H(e, "change", () => {
			let t = Array.prototype.filter.call(e.options, (e) => e.selected).map((e) => n ? se(G(e)) : G(e)), r = e.multiple, i = r ? ve(e._modelValue) ? new Set(t) : t : t[0], a = e._pendingValue = [r, r ? S(i) ? t.slice() : t : i];
			try {
				e[W](i);
			} finally {
				Oe(() => {
					e._pendingValue === a && (e._pendingValue = void 0);
				});
			}
		}), e[W] = ft(r);
	},
	mounted(e, { value: t }) {
		Ct(e, t);
	},
	beforeUpdate(e, { value: t }, n) {
		e._modelValue = t, e[W] = ft(n);
	},
	updated(e, { value: t }) {
		let n = e._pendingValue;
		e._pendingValue = void 0, n && n[0] === e.multiple && St(t, n[1], n[0]) || Ct(e, t);
	}
};
function St(e, t, n) {
	if (!n || S(e)) return ye(e, t);
	if (ve(e)) {
		if (e.size !== t.length) return !1;
		for (let n of t) if (!e.has(n)) return !1;
		return !0;
	}
	return !1;
}
function Ct(e, t) {
	let n = e.multiple, r = S(t);
	if (!n || r || ve(t)) {
		for (let i = 0, a = e.options.length; i < a; i++) {
			let a = e.options[i], o = G(a);
			if (n) {
				if (r) {
					let e = typeof o;
					a.selected = e === "string" || e === "number" ? t.some((e) => String(e) === String(o)) : we(t, o) > -1;
				} else a.selected = t.has(o);
			} else if (ye(G(a), t)) {
				e.selectedIndex !== i && (e.selectedIndex = i);
				return;
			}
		}
		!n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
	}
}
function G(e) {
	return "_value" in e ? e._value : e.value;
}
function wt(e, t) {
	let n = t ? "_trueValue" : "_falseValue";
	return n in e ? e[n] : t;
}
var Tt = {
	created(e, t, n) {
		Dt(e, t, n, null, "created");
	},
	mounted(e, t, n) {
		Dt(e, t, n, null, "mounted");
	},
	beforeUpdate(e, t, n, r) {
		Dt(e, t, n, r, "beforeUpdate");
	},
	updated(e, t, n, r) {
		Dt(e, t, n, r, "updated");
	}
};
function Et(e, t) {
	switch (e) {
		case "SELECT": return xt;
		case "TEXTAREA": return _t;
		default: switch (t) {
			case "checkbox": return vt;
			case "radio": return bt;
			default: return _t;
		}
	}
}
function Dt(e, t, n, r, i) {
	let a = Et(e.tagName, n.props && n.props.type)[i];
	a && a(e, t, n, r);
}
var Ot = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], kt = {
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
	exact: (e, t) => Ot.some((n) => e[`${n}Key`] && !t.includes(n))
}, At = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = kt[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, jt = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, Mt = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = u(n.key);
		if (t.some((e) => e === r || jt[e] === r)) return e(n);
	}));
}, Nt = /* @__PURE__ */ d({ patchProp: ot }, Ie), Pt;
function Ft() {
	return Pt ||= ge(Nt);
}
var It = ((...e) => {
	Ft().render(...e);
}), Lt = ((...e) => {
	let t = Ft().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = zt(e);
		if (!r) return;
		let i = t._component;
		_(i) || i.render || i.template || (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, Rt(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function Rt(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function zt(e) {
	return fe(e) ? document.querySelector(e) : e;
}
// node_modules/reka-ui/dist/shared/createContext.js
function K(e, t) {
	let n = typeof e == "string" && !t ? `${e}Context` : t, r = Symbol(n);
	return [(t) => {
		let n = y(r, t);
		if (n || n === null) return n;
		throw Error(`Injection \`${r.toString()}\` not found. Component must be used within ${Array.isArray(e) ? `one of the following components: ${e.join(", ")}` : `\`${e}\``}`);
	}, (e) => (me(r, e), e)];
}
// node_modules/reka-ui/node_modules/@vueuse/shared/dist/index.js
var q = typeof window < "u" && typeof document < "u";
typeof WorkerGlobalScope < "u" && globalThis instanceof WorkerGlobalScope;
var Bt = (e) => e !== void 0;
q && window.document, q && window.navigator, q && window.location;
function J(e) {
	let t = te(e);
	return t?.$el ?? t;
}
function Vt(e) {
	return JSON.parse(JSON.stringify(e));
}
function Ht(e, t, n, r = {}) {
	var i, a;
	let { clone: o = !1, passive: s = !1, eventName: c, deep: l = !1, defaultValue: u, shouldEmit: d } = r, f = ae(), p = n || f?.emit || (f == null || (i = f.$emit) == null ? void 0 : i.bind(f)) || (f == null || (a = f.proxy) == null || (a = a.$emit) == null ? void 0 : a.bind(f?.proxy)), h = c;
	t ||= "modelValue", h ||= `update:${t.toString()}`;
	let g = (e) => o ? typeof o == "function" ? o(e) : Vt(e) : e, _ = () => Bt(e[t]) ? g(e[t]) : u, y = (e) => {
		d ? d(e) && p(h, e) : p(h, e);
	};
	if (s) {
		let n = v(_()), r = !1;
		return m(() => e[t], (e) => {
			r || (r = !0, n.value = g(e), Oe(() => r = !1));
		}), m(n, (n) => {
			!r && (n !== e[t] || l) && y(n);
		}, { deep: l }), n;
	}
	return k({
		get() {
			return _();
		},
		set(e) {
			y(e);
		}
	});
}
// node_modules/reka-ui/dist/shared/renderSlotFragments.js
function Ut(e) {
	return e ? e.flatMap((e) => e.type === A ? Ut(e.children) : [e]) : [];
}
// node_modules/reka-ui/dist/shared/useEmitAsProps.js
function Wt(e) {
	let t = ae(), n = t?.type.emits, r = {};
	return n?.length || console.warn(`No emitted event found. Please check component: ${t?.type.__name}`), n?.forEach((t) => {
		r[le(x(t))] = (...n) => e(t, ...n);
	}), r;
}
// node_modules/reka-ui/dist/shared/useFormControl.js
function Gt(e) {
	return k(() => !te(e) || !!J(e)?.closest("form"));
}
// node_modules/reka-ui/dist/shared/useForwardExpose.js
function Kt() {
	let e = ae(), t = v(), n = k(() => r());
	i(() => {
		n.value !== r() && c(t);
	});
	function r() {
		return t.value && "$el" in t.value && ["#text", "#comment"].includes(t.value.$el.nodeName) ? t.value.$el.nextElementSibling : J(t);
	}
	let a = Object.assign({}, e.exposed), o = {};
	for (let t in e.props) Object.defineProperty(o, t, {
		enumerable: !0,
		configurable: !0,
		get: () => e.props[t]
	});
	if (Object.keys(a).length > 0) for (let e in a) Object.defineProperty(o, e, {
		enumerable: !0,
		configurable: !0,
		get: () => a[e]
	});
	Object.defineProperty(o, "$el", {
		enumerable: !0,
		configurable: !0,
		get: () => e.vnode.el
	}), e.exposed = o;
	function s(n) {
		if (t.value = n, n && (Object.defineProperty(o, "$el", {
			enumerable: !0,
			configurable: !0,
			get: () => n instanceof Element ? n : n.$el
		}), !(n instanceof Element) && !Object.hasOwn(n, "$el"))) {
			let t = n.$.exposed, r = Object.assign({}, o);
			for (let e in t) Object.defineProperty(r, e, {
				enumerable: !0,
				configurable: !0,
				get: () => t[e]
			});
			e.exposed = r;
		}
	}
	return {
		forwardRef: s,
		currentRef: t,
		currentElement: n
	};
}
// node_modules/reka-ui/dist/shared/useForwardProps.js
function qt(e) {
	let t = ae(), n = Object.keys(t?.type.props ?? {}).reduce((e, n) => {
		let r = (t?.type.props[n]).default;
		return r !== void 0 && (e[n] = r), e;
	}, {}), r = Ae(e);
	return k(() => {
		let e = {}, i = t?.vnode.props ?? {};
		return Object.keys(i).forEach((t) => {
			e[x(t)] = i[t];
		}), Object.keys({
			...n,
			...e
		}).reduce((e, t) => (r.value[t] !== void 0 && (e[t] = r.value[t]), e), {});
	});
}
// node_modules/reka-ui/dist/shared/useForwardPropsEmits.js
function Jt(e, t) {
	let n = qt(e), r = t ? Wt(t) : {};
	return k(() => ({
		...n.value,
		...r
	}));
}
// node_modules/reka-ui/dist/shared/useForwardScopeId.js
function Yt() {
	let e = ae()?.vnode?.scopeId;
	return e ? { [e]: "" } : {};
}
// node_modules/reka-ui/dist/Primitive/Slot.js
var Xt = /*#__PURE__*/ F({
	name: "PrimitiveSlot",
	inheritAttrs: !1,
	setup(e, { attrs: t, slots: n }) {
		return () => {
			if (!n.default) return null;
			let e = Ut(n.default()), i = e.findIndex((e) => e.type !== ie);
			if (i === -1) return e;
			let a = e[i];
			delete a.props?.ref;
			let o = a.props ? r(t, a.props) : t, s = oe({
				...a,
				props: {}
			}, o);
			return e.length === 1 ? s : (e[i] = s, e);
		};
	}
}), Zt = [
	"area",
	"img",
	"input"
], Qt = /*#__PURE__*/ F({
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
	setup(e, { attrs: t, slots: n }) {
		let r = e.asChild ? "template" : e.as;
		return typeof r == "string" && Zt.includes(r) ? () => ke(r, t) : r === "template" ? () => ke(Xt, t, { default: n.default }) : () => ke(e.as, t, { default: n.default });
	}
});
// node_modules/reka-ui/dist/Primitive/usePrimitiveElement.js
function $t() {
	let e = v();
	return {
		primitiveElement: e,
		currentElement: k(() => ["#text", "#comment"].includes(e.value?.$el.nodeName) ? e.value?.$el.nextElementSibling : J(e))
	};
}
// node_modules/reka-ui/dist/VisuallyHidden/VisuallyHidden.js
var en = /* @__PURE__ */ F({
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
		return (t, n) => (h(), T(b(Qt), {
			as: e.as,
			"as-child": e.asChild,
			"aria-hidden": e.feature === "fully-hidden" ? "true" : void 0,
			"data-hidden": e.feature === "fully-hidden" ? "" : void 0,
			tabindex: e.feature === "fully-hidden" ? "-1" : void 0,
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
			default: g(() => [pe(t.$slots, "default")]),
			_: 3
		}, 8, [
			"as",
			"as-child",
			"aria-hidden",
			"data-hidden",
			"tabindex"
		]));
	}
}), tn = /* @__PURE__ */ F({
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
		let t = e, { primitiveElement: n, currentElement: i } = $t(), a = k(() => t.checked ?? t.value);
		return m(a, (e, t) => {
			if (!i.value) return;
			let n = i.value, r = window.HTMLInputElement.prototype, a = Object.getOwnPropertyDescriptor(r, "value").set;
			if (a && e !== t) {
				let t = new Event("input", { bubbles: !0 }), r = new Event("change", { bubbles: !0 });
				a.call(n, e), n.dispatchEvent(t), n.dispatchEvent(r);
			}
		}), (e, i) => (h(), T(en, r({
			ref_key: "primitiveElement",
			ref: n
		}, {
			...t,
			...e.$attrs
		}, { as: "input" }), null, 16));
	}
}), nn = /* @__PURE__ */ F({
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
		let n = e, i = k(() => typeof n.value == "object" && Array.isArray(n.value) && n.value.length === 0 && n.required), a = k(() => typeof n.value == "string" || typeof n.value == "number" || typeof n.value == "boolean" || n.value === null || n.value === void 0 ? [{
			name: n.name,
			value: n.value
		}] : typeof n.value == "object" && Array.isArray(n.value) ? n.value.flatMap((e, t) => typeof e == "object" ? Object.entries(e).map(([e, r]) => ({
			name: `${n.name}[${t}][${e}]`,
			value: r
		})) : {
			name: `${n.name}[${t}]`,
			value: e
		}) : n.value !== null && typeof n.value == "object" && !Array.isArray(n.value) ? Object.entries(n.value).map(([e, t]) => ({
			name: `${n.name}[${e}]`,
			value: t
		})) : []);
		return (o, s) => (h(), j(A, null, [D(" We render single input if it's required "), i.value ? (h(), T(tn, r({ key: e.name }, {
			...n,
			...o.$attrs
		}, {
			name: e.name,
			value: e.value
		}), null, 16, ["name", "value"])) : (h(!0), j(A, { key: 1 }, t(a.value, (e) => (h(), T(tn, r({ key: e.name }, { ref_for: !0 }, {
			...n,
			...o.$attrs
		}, {
			name: e.name,
			value: e.value
		}), null, 16, ["name", "value"]))), 128))], 2112));
	}
}), [rn, an] = /*#__PURE__*/ K("SwitchRoot"), on = /* @__PURE__ */ F({
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
		let i = e, a = t, { disabled: o } = n(i), s = Ht(i, "modelValue", a, {
			defaultValue: i.defaultValue ?? i.falseValue,
			passive: i.modelValue === void 0
		}), c = k(() => s.value === i.trueValue);
		function l() {
			o.value || (s.value = c.value ? i.falseValue : i.trueValue);
		}
		let { forwardRef: u, currentElement: d } = Kt(), f = Gt(d), p = Yt(), m = k(() => i.id && d.value ? document.querySelector(`[for="${i.id}"]`)?.innerText : void 0);
		return an({
			checked: c,
			toggleCheck: l,
			disabled: o
		}), (t, n) => (h(), j(A, null, [C(b(Qt), r({
			id: e.id,
			ref: b(u),
			role: "switch",
			type: e.as === "button" ? "button" : void 0,
			value: e.value,
			"aria-label": t.$attrs["aria-label"] || m.value,
			"aria-checked": c.value,
			"aria-required": e.required,
			"data-state": c.value ? "checked" : "unchecked",
			"data-disabled": b(o) ? "" : void 0,
			"as-child": e.asChild,
			as: e.as,
			disabled: b(o)
		}, {
			...b(p),
			...t.$attrs
		}, {
			onClick: l,
			onKeydown: Mt(At(l, ["prevent"]), ["enter"])
		}), {
			default: g(() => [pe(t.$slots, "default", {
				modelValue: b(s),
				checked: c.value
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
		]), b(f) && e.name ? (h(), T(b(nn), r({
			key: 0,
			type: "checkbox",
			name: e.name,
			disabled: b(o),
			required: e.required,
			value: e.value,
			checked: c.value
		}, b(p)), null, 16, [
			"name",
			"disabled",
			"required",
			"value",
			"checked"
		])) : D("v-if", !0)], 64));
	}
}), sn = /* @__PURE__ */ F({
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
		let t = rn();
		return Kt(), (n, r) => (h(), T(b(Qt), {
			"data-state": b(t).checked.value ? "checked" : "unchecked",
			"data-disabled": b(t).disabled.value ? "" : void 0,
			"as-child": e.asChild,
			as: e.as
		}, {
			default: g(() => [pe(n.$slots, "default")]),
			_: 3
		}, 8, [
			"data-state",
			"data-disabled",
			"as-child",
			"as"
		]));
	}
}), cn = /* @__PURE__ */ F({
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
		let n = e, i = t, a = Jt(k(() => {
			let { class: e, ...t } = n;
			return t;
		}), i);
		return (e, t) => (h(), T(b(on), r(b(a), {
			as: "button",
			type: "button",
			class: b(de)("peer focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-input inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50", n.class)
		}), {
			default: g(() => [C(b(sn), { class: "bg-background pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" })]),
			_: 1
		}, 16, ["class"]));
	}
}), ln = typeof window < "u" && typeof document < "u";
typeof WorkerGlobalScope < "u" && globalThis instanceof WorkerGlobalScope;
var Y = (e) => e !== void 0;
ln && window.document, ln && window.navigator, ln && window.location;
function X(e) {
	return JSON.parse(JSON.stringify(e));
}
/* @__NO_SIDE_EFFECTS__ */
function un(e, t, n, r = {}) {
	var i, a;
	let { clone: o = !1, passive: s = !1, eventName: c, deep: l = !1, defaultValue: u, shouldEmit: d } = r, f = ae(), p = n || f?.emit || (f == null || (i = f.$emit) == null ? void 0 : i.bind(f)) || (f == null || (a = f.proxy) == null || (a = a.$emit) == null ? void 0 : a.bind(f?.proxy)), h = c;
	t ||= "modelValue", h ||= `update:${t.toString()}`;
	let g = (e) => o ? typeof o == "function" ? o(e) : X(e) : e, _ = () => Y(e[t]) ? g(e[t]) : u, y = (e) => {
		d ? d(e) && p(h, e) : p(h, e);
	};
	if (s) {
		let n = _(), r = v(n), i = !1;
		return m(() => e[t], (e) => {
			i || (i = !0, r.value = g(e), Oe(() => i = !1));
		}), m(r, (n) => {
			!i && (n !== e[t] || l) && y(n);
		}, { deep: l }), r;
	}
	return k({
		get() {
			return _();
		},
		set(e) {
			y(e);
		}
	});
}
// src/components/ui/Input.vue?vue&type=script&setup=true&lang.ts
var dn = ["type", "placeholder"], Z = /* @__PURE__ */ F({
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
		let n = e, r = /* @__PURE__ */ un(n, "modelValue", t, {
			passive: !0,
			defaultValue: n.defaultValue
		});
		return (t, i) => o((h(), j("input", {
			"onUpdate:modelValue": i[0] ||= (e) => l(r) ? r.value = e : null,
			type: e.type ?? "text",
			placeholder: e.placeholder,
			class: he(b(de)("border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50", n.class))
		}, null, 10, dn)), [[Tt, b(r)]]);
	}
}), fn = ["id", "disabled"], pn = /* @__PURE__ */ F({
	__name: "Select",
	props: {
		modelValue: { type: String },
		class: { type: String },
		id: { type: String },
		disabled: { type: Boolean }
	},
	emits: ["update:modelValue"],
	setup(e, { emit: t }) {
		let n = e, r = /* @__PURE__ */ un(n, "modelValue", t, { passive: !0 });
		return (t, i) => (h(), j("div", { class: he(b(de)("relative inline-block", n.class)) }, [o(P("select", {
			id: e.id,
			"onUpdate:modelValue": i[0] ||= (e) => l(r) ? r.value = e : null,
			disabled: e.disabled,
			class: "border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full cursor-pointer appearance-none rounded-md border py-2 pr-8 pl-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
		}, [pe(t.$slots, "default")], 8, fn), [[xt, b(r)]]), i[1] ||= P("svg", {
			class: "text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2",
			width: "10",
			height: "6",
			viewBox: "0 0 10 6",
			fill: "none",
			"aria-hidden": "true"
		}, [P("path", {
			d: "M1 1L5 5L9 1",
			stroke: "currentColor",
			"stroke-width": "1.5",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		})], -1)], 2));
	}
}), mn = ["for"], Q = /* @__PURE__ */ F({
	__name: "Label",
	props: {
		for: { type: String },
		class: { type: String }
	},
	setup(e) {
		return (e, t) => (h(), j("label", {
			for: e.$props.for,
			class: he(["text-sm leading-none font-medium", e.$props.class])
		}, [pe(e.$slots, "default")], 10, mn));
	}
}), hn = { class: "inline_help" }, $ = /* @__PURE__ */ F({
	__name: "HelpText",
	setup(e) {
		return (e, t) => (h(), j("blockquote", hn, [pe(e.$slots, "default")]));
	}
}), gn = {
	role: "tablist",
	"aria-label": "Incus settings sections",
	class: "mb-6 flex gap-1 border-b border-border"
}, _n = [
	"id",
	"aria-selected",
	"aria-controls",
	"tabindex",
	"onClick",
	"onKeydown"
], vn = /* @__PURE__ */ F({
	__name: "TabNavigation",
	props: {
		modelValue: { required: !0 },
		modelModifiers: {}
	},
	emits: ["update:modelValue"],
	setup(e) {
		let n = p(e, "modelValue"), r = [
			{
				id: "builder",
				label: "Builder"
			},
			{
				id: "jails",
				label: "Containers"
			},
			{
				id: "config",
				label: "Config"
			}
		];
		function i(e, t) {
			let i = r.findIndex((e) => e.id === t), a = null;
			e.key === "ArrowRight" ? a = (i + 1) % r.length : e.key === "ArrowLeft" ? a = (i - 1 + r.length) % r.length : e.key === "Home" ? a = 0 : e.key === "End" && (a = r.length - 1), a !== null && (e.preventDefault(), n.value = r[a].id, document.getElementById(`incus-tab-${r[a].id}`)?.focus());
		}
		return (e, a) => (h(), j("div", gn, [(h(), j(A, null, t(r, (e) => P("button", {
			id: `incus-tab-${e.id}`,
			key: e.id,
			role: "tab",
			type: "button",
			"aria-selected": n.value === e.id,
			"aria-controls": `incus-panel-${e.id}`,
			tabindex: n.value === e.id ? 0 : -1,
			class: he(["-mb-px cursor-pointer border-b-[3px] px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition-colors", n.value === e.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"]),
			onClick: (t) => n.value = e.id,
			onKeydown: (t) => i(t, e.id)
		}, E(e.label), 43, _n)), 64))]));
	}
}), yn = 2e3;
function bn(e, t, n = {}) {
	let r = !1, i = null, a = null, o = new AbortController(), s = typeof document > "u" ? null : document, c = {
		signal: o.signal,
		isActive: () => !r && !o.signal.aborted
	}, l = () => {
		r || (a = setTimeout(() => void u(), t));
	}, u = async () => {
		if (!r) {
			if (s?.hidden) l();
			else return i || (i = e(c).catch((e) => {
				c.isActive() && n.onError?.(e);
			}).finally(() => {
				i = null, l();
			}), i);
		}
	};
	n.immediate ? u() : l();
	let d = () => {
		s?.hidden || r || i || (a && clearTimeout(a), a = null, u());
	};
	return s?.addEventListener("visibilitychange", d), {
		stop() {
			r = !0, o.abort(), a && clearTimeout(a), a = null, s?.removeEventListener("visibilitychange", d);
		},
		trigger: u
	};
}
// src/lib/configPayload.ts
function xn(e, t) {
	let { tsAuthKeyConfigured: n, ...r } = e, i = {
		...r,
		jailIpv6: "none"
	};
	return t.clear ? {
		...i,
		tsAuthKey: ""
	} : t.replacement ? {
		...i,
		tsAuthKey: t.replacement
	} : i;
}
// src/composables/useResourceMetrics.ts
function Sn(e, t) {
	let n = f(/* @__PURE__ */ new Map()), r = f(/* @__PURE__ */ new Map()), i = v([]), a = f(/* @__PURE__ */ new Map()), o = k(() => e.value.filter((e) => e.status.toLowerCase() === "running")), s = k(() => e.value.length - o.value.length), c = k(() => o.value.reduce((e, t) => e + Number(t.memoryUsageBytes ?? 0), 0)), l = k(() => o.value.reduce((e, t) => e + BigInt(t.cpuUsageNs ?? "0"), 0n));
	function u(e) {
		if (e == null) return "—";
		let t = Math.floor(e / 1e9), n = Math.floor(t / 3600), r = Math.floor(t % 3600 / 60), i = t % 60;
		return n > 0 ? `${n}h ${r}m ${i}s` : r > 0 ? `${r}m ${i}s` : `${i}s`;
	}
	function d(e) {
		if (e == null) return "—";
		if (e === 0) return "0 B";
		let t = [
			"B",
			"KiB",
			"MiB",
			"GiB",
			"TiB"
		], n = Math.min(Math.floor(Math.log(e) / Math.log(1024)), t.length - 1), r = e / 1024 ** n;
		return `${r >= 10 || n === 0 ? Math.round(r) : r.toFixed(1)} ${t[n]}`;
	}
	function p(e) {
		if (e.memoryUsageBytes == null) return "—";
		let t = d(Number(e.memoryUsageBytes));
		return e.memoryTotalBytes ? `${t} / ${d(Number(e.memoryTotalBytes))}` : t;
	}
	function m(e) {
		return !e.memoryTotalBytes || e.memoryUsageBytes == null ? null : Math.min(100, Math.round(Number(e.memoryUsageBytes) / Number(e.memoryTotalBytes) * 100));
	}
	function h() {
		let e = t().trim();
		if (!/^\d+$/.test(e)) return null;
		let n = Number(e);
		return n > 0 ? n : null;
	}
	function g() {
		let t = Date.now(), o = 0, s = !1, c = 0, l = 0;
		for (let i of e.value) {
			if (i.cpuUsageNs == null) {
				n.delete(i.name), a.delete(i.name);
				continue;
			}
			let e = BigInt(i.cpuUsageNs), u = n.get(i.name);
			if (u) {
				let n = e - u.cpuUsageNs, d = t - u.atMs;
				if (n >= 0n && d > 0) {
					let e = Number(n) / (d * 1e6) * 100;
					a.set(i.name, e);
					let u = m(i), f = r.get(i.name) ?? [];
					f.push({
						atMs: t,
						cpuPct: e,
						memPct: u
					}), f.length > 30 && f.shift(), r.set(i.name, f), i.status.toLowerCase() === "running" && (o += e, s = !0, u !== null && (c += u, l++));
				} else a.delete(i.name);
			} else a.delete(i.name);
			n.set(i.name, {
				atMs: t,
				cpuUsageNs: e
			});
		}
		let u = new Set(e.value.map((e) => e.name));
		for (let e of [
			n,
			r,
			a
		]) for (let t of Array.from(e.keys())) u.has(t) || e.delete(t);
		s && (i.value.push({
			atMs: t,
			cpuPct: o,
			memPct: l ? c / l : null
		}), i.value.length > 30 && i.value.shift());
	}
	return {
		runningJails: o,
		stoppedJailsCount: s,
		totalMemoryUsageBytes: c,
		totalCpuUsageNs: l,
		fleetHistory: i,
		formatDuration: u,
		formatBytes: d,
		formatMemory: p,
		memoryFillPct: m,
		updateCpuSamplesAndHistory: g,
		cpuRateLabel: (e) => a.has(e.name) ? `${a.get(e.name).toFixed(+(a.get(e.name) < 10))}%` : "—",
		cpuRatePct: (e) => {
			let t = a.get(e.name);
			return t === void 0 ? null : Math.min(100, Math.max(0, Math.round(h() ? t / h() : t)));
		},
		cpuRateSuffix: () => h() ? `of ${h()} core${h() === 1 ? "" : "s"}` : "of 1 core",
		jailCpuHistory: (e) => r.get(e) ?? [],
		totalCpuRateLabel: () => i.value.length ? `${i.value.at(-1).cpuPct.toFixed(+(i.value.at(-1).cpuPct < 10))}%` : "—",
		sparklinePoints: (e, t, n = 80, r = 24) => e.map((i, a) => i[t] === null ? null : `${(a * (n / Math.max(1, e.length - 1))).toFixed(1)},${(r - Math.min(100, Math.max(0, i[t])) / 100 * r).toFixed(1)}`).filter(Boolean).join(" ")
	};
}
// src/graphql/operations.ts
var Cn = "query { incusConfig {\n  enabled stateDir storageDriver storageSource storagePoolName jailBridge jailSubnet jailNat jailIpv6\n  aclName aclBlock aclAllow aclDefaultEgress aclDefaultIngress jailProfile jailImage jailNesting jailCpu jailMemory\n  jailWorkspaceRoot jailAgentUid jailAgentGid jailBindMounts tsAuthKeyConfigured dashboardWidgetEnable\n} }", wn = "query { incusHealthy incusPluginHealth { status message } jails { name status ipv4 cpuUsageNs memoryUsageBytes memoryTotalBytes } }", Tn = "mutation($input: IncusConfigInput!) { updateIncusConfig(input: $input) { enabled } }", En = "mutation($name: String!, $action: JailAction!) { setJailState(name: $name, action: $action) }", Dn = "mutation($name: String!) { deleteJail(name: $name) }", On = "mutation($name: String!, $image: String, $allowSudo: Boolean) { launchJail(name: $name, image: $image, allowSudo: $allowSudo) }", kn = "query($name: String!) { jailDetail(name: $name) { name profiles imageOs imageRelease imageDescription storagePool networkBridge cpuLimit cpuLimitIsOverride memoryLimit memoryLimitIsOverride workspaceHostPath workspaceIsOverride sudoEnabled } }", An = "mutation($name: String!) { grantJailSudo(name: $name) }", jn = "mutation($name: String!, $command: String!) { startPrivilegedCommand(name: $name, command: $command) }", Mn = "query($id: String!) { privilegedCommandStatus(id: $id) { id command status exitCode stdout stderr message } }", Nn = "mutation($name: String!, $hostPath: String!) { setJailWorkspace(name: $name, hostPath: $hostPath) }", Pn = "mutation($name: String!) { clearJailWorkspace(name: $name) }", Fn = "mutation($name: String!, $cpu: String, $memory: String) { setJailLimits(name: $name, cpu: $cpu, memory: $memory) }", In = "mutation($distro: String!, $release: String!, $packages: [String!]!, $alias: String!, $basedOn: String, $postInstallCommands: [String!]) { buildJailImage(distro: $distro, release: $release, packages: $packages, alias: $alias, basedOn: $basedOn, postInstallCommands: $postInstallCommands) }", Ln = "mutation($alias: String!) { deleteJailImage(alias: $alias) }", Rn = "query($query: String!, $distro: String, $release: String) { searchAllPackages(query: $query, distro: $distro, release: $release) { results { ecosystem name description version } errors { ecosystem message } } }", zn = "query($buildId: String!) { jailImageBuildStatus(buildId: $buildId) { id status alias distro release packages logTail error } }", Bn = "query { builderPresets { name distro release packages } }", Vn = "mutation($input: BuilderPresetInput!) { saveBuilderPreset(input: $input) { name } }", Hn = "mutation($name: String!) { deleteBuilderPreset(name: $name) }", Un = "query { jailImages { alias distro release packages isMaster basedOn createdAt } }", Wn = "mutation($alias: String!, $isMaster: Boolean!) { setMasterImage(alias: $alias, isMaster: $isMaster) { alias isMaster } }", Gn = "mutation { pruneStaleImageRecords }", Kn = "mutation($name: String!) { migrateJailWorkspace(name: $name) }", qn = "mutation($name: String!, $formula: String!) { installHomebrewFormula(name: $name, formula: $formula) }", Jn = "query($id: String!) { homebrewInstallStatus(id: $id) { id formula status message } }";
// src/composables/useJailDetail.ts
function Yn(e) {
	let t = v(null), n = v(null), r = v(!1), i = v(""), a = v(""), o = v(""), s = v(""), c = 0;
	async function l(i) {
		e(), t.value === i ? (++c, t.value = null, n.value = null, r.value = !1) : (t.value = i, await u(i));
	}
	async function u(e) {
		let l = ++c;
		r.value = !0, i.value = "";
		try {
			let r = await N(kn, { name: e });
			if (l !== c || t.value !== e) return;
			n.value = r.jailDetail, a.value = r.jailDetail.cpuLimit ?? "", o.value = r.jailDetail.memoryLimit ?? "", s.value = r.jailDetail.workspaceHostPath ?? "";
		} catch (n) {
			if (l !== c || t.value !== e) return;
			i.value = n instanceof Error ? n.message : String(n);
		} finally {
			l === c && (r.value = !1);
		}
	}
	return {
		detailsJailName: t,
		jailDetail: n,
		detailLoading: r,
		detailError: i,
		editCpuLimit: a,
		editMemoryLimit: o,
		editWorkspacePath: s,
		toggleJailDetails: l,
		loadJailDetail: u
	};
}
// src/App.vue?vue&type=script&setup=true&lang.ts
var Xn = { class: "unapi w-full max-w-4xl text-foreground xl:max-w-6xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1880px] min-[2560px]:max-w-[2200px]" }, Zn = {
	key: 0,
	class: "py-8 text-muted-foreground"
}, Qn = {
	key: 0,
	role: "alert",
	class: "mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
}, $n = {
	key: 1,
	role: "alert",
	"data-testid": "incus-degraded",
	class: "mb-4 rounded-md border border-orange bg-orange/10 px-4 py-3 text-sm"
}, er = { class: "mt-1" }, tr = { class: "mb-6 flex items-center gap-3 border-b border-border pb-4" }, nr = { class: "ml-auto flex items-center gap-3" }, rr = {
	key: 2,
	id: "incus-panel-builder",
	role: "tabpanel",
	"aria-labelledby": "incus-tab-builder",
	tabindex: "0"
}, ir = { class: "grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]" }, ar = { class: "mb-6 rounded-lg border border-border bg-card p-4 xl:mb-0" }, or = {
	key: 0,
	class: "mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, sr = {
	key: 1,
	class: "text-sm text-muted-foreground"
}, cr = {
	key: 2,
	class: "mb-3 flex flex-wrap gap-2"
}, lr = ["onClick"], ur = { class: "font-mono text-muted-foreground" }, dr = ["onClick"], fr = { class: "flex gap-2" }, pr = { class: "mt-5 border-t border-border pt-4" }, mr = { class: "mb-2 flex items-center justify-between gap-3" }, hr = {
	key: 0,
	class: "mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, gr = {
	key: 1,
	class: "mb-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs"
}, _r = {
	key: 2,
	class: "text-sm text-muted-foreground"
}, vr = {
	key: 3,
	class: "flex flex-col gap-2"
}, yr = { class: "min-w-0 flex-1" }, br = { class: "flex items-center gap-2" }, xr = { class: "font-mono text-[13px] font-medium" }, Sr = { class: "text-xs text-muted-foreground" }, Cr = { class: "mt-0.5 truncate text-xs text-muted-foreground" }, wr = { class: "mt-5 border-t border-border pt-4" }, Tr = ["aria-expanded"], Er = {
	key: 0,
	id: "config-import-panel",
	class: "mt-3 flex flex-col gap-4"
}, Dr = {
	key: 0,
	class: "mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Or = {
	key: 1,
	class: "mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs"
}, kr = {
	key: 0,
	class: "text-foreground"
}, Ar = {
	key: 1,
	class: "mt-1"
}, jr = { class: "font-mono" }, Mr = {
	key: 2,
	class: "mt-1"
}, Nr = {
	key: 3,
	class: "mt-1"
}, Pr = { class: "ml-4 list-disc text-muted-foreground" }, Fr = { class: "border-t border-border pt-4" }, Ir = { class: "flex gap-2" }, Lr = {
	key: 0,
	class: "mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Rr = {
	key: 1,
	class: "mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs"
}, zr = { class: "font-mono" }, Br = { class: "border-t border-border pt-4" }, Vr = { class: "flex flex-wrap gap-2" }, Hr = { class: "mb-6 rounded-lg border border-border bg-card p-4" }, Ur = {
	key: 0,
	class: "mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
}, Wr = {
	key: 1,
	class: "mb-4 flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs"
}, Gr = { class: "font-mono font-medium" }, Kr = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, qr = { class: "flex justify-self-end gap-2" }, Jr = ["value"], Yr = { class: "flex justify-self-end gap-2" }, Xr = ["value"], Zr = { class: "mt-5 border-t border-border pt-4" }, Qr = {
	key: 0,
	class: "mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, $r = {
	key: 1,
	class: "mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
}, ei = {
	key: 2,
	class: "mt-2 text-xs text-muted-foreground"
}, ti = {
	key: 3,
	class: "mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto"
}, ni = { class: "min-w-0 flex-1" }, ri = { class: "font-mono font-medium" }, ii = {
	key: 0,
	class: "ml-1.5 font-mono text-muted-foreground"
}, ai = {
	key: 1,
	class: "truncate text-muted-foreground"
}, oi = {
	key: 1,
	class: "shrink-0 text-muted-foreground"
}, si = {
	key: 4,
	class: "mt-2 text-xs text-muted-foreground"
}, ci = {
	key: 5,
	class: "mt-3"
}, li = { class: "flex flex-wrap gap-1.5" }, ui = ["aria-label", "onClick"], di = {
	key: 6,
	class: "mt-3"
}, fi = { class: "flex flex-col gap-1" }, pi = { class: "flex-1" }, mi = ["aria-label", "onClick"], hi = { class: "mt-4" }, gi = { class: "mt-4 flex justify-end" }, _i = { class: "rounded-lg border border-border bg-card p-4" }, vi = {
	key: 0,
	class: "flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2.5"
}, yi = {
	key: 1,
	class: "flex flex-col gap-4"
}, bi = { class: "mb-2 flex items-center justify-between gap-3" }, xi = { class: "flex items-center gap-2" }, Si = { class: "text-sm font-medium" }, Ci = { class: "text-xs text-muted-foreground" }, wi = {
	key: 0,
	class: "mb-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Ti = { class: "flex items-center gap-2 rounded-t-md border border-b-0 border-neutral-800 bg-neutral-950 px-3 py-1.5" }, Ei = { class: "font-mono text-[11px] text-neutral-400" }, Di = { class: "max-h-48 overflow-auto rounded-b-md border border-neutral-800 bg-neutral-950 p-2.5 text-xs font-mono whitespace-pre-wrap text-neutral-200" }, Oi = {
	key: 3,
	id: "incus-panel-jails",
	role: "tabpanel",
	"aria-labelledby": "incus-tab-jails",
	tabindex: "0"
}, ki = { class: "mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" }, Ai = { class: "rounded-lg border border-border bg-card p-3" }, ji = { class: "mt-1 font-mono text-xl" }, Mi = { class: "rounded-lg border border-border bg-card p-3" }, Ni = { class: "mt-1 font-mono text-xl" }, Pi = { class: "rounded-lg border border-border bg-card p-3" }, Fi = { class: "mt-1 font-mono text-xl" }, Ii = { class: "rounded-lg border border-border bg-card p-3" }, Li = { class: "mt-1.5" }, Ri = { class: "rounded-lg border border-border bg-card p-3" }, zi = { class: "mt-1 font-mono text-xl" }, Bi = { class: "rounded-lg border border-border bg-card p-3" }, Vi = { class: "mt-1 font-mono text-xl" }, Hi = {
	key: 0,
	viewBox: "0 0 80 24",
	width: "80",
	height: "24",
	class: "mt-1 text-primary",
	preserveAspectRatio: "none"
}, Ui = ["points"], Wi = { class: "mb-6 grid grid-cols-1 items-start gap-4 xl:grid-cols-2" }, Gi = { class: "rounded-lg border border-border bg-card p-4" }, Ki = { class: "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3" }, qi = { class: "mt-1 font-mono text-sm" }, Ji = { class: "mt-1 font-mono text-sm" }, Yi = { class: "mt-1 font-mono text-sm" }, Xi = { class: "mt-1 font-mono text-sm" }, Zi = { class: "mt-1 font-mono text-sm" }, Qi = { class: "rounded-lg border border-border bg-card p-4" }, $i = { class: "flex flex-col gap-3 sm:flex-row sm:items-end" }, ea = { class: "flex-1" }, ta = { class: "flex-1" }, na = { value: "" }, ra = ["value"], ia = {
	key: 0,
	class: "mt-2 text-xs text-destructive"
}, aa = { class: "mt-3 flex items-center gap-2.5" }, oa = { class: "rounded-lg border border-border bg-card p-4" }, sa = { class: "mb-4 flex items-center justify-between gap-3" }, ca = {
	key: 0,
	class: "text-sm text-muted-foreground"
}, la = { class: "mb-3 text-xs text-muted-foreground" }, ua = { class: "grid grid-cols-1 gap-4 xl:grid-cols-2" }, da = { class: "flex flex-wrap items-center justify-between gap-2" }, fa = { class: "flex min-w-0 items-center gap-2" }, pa = { class: "truncate font-mono text-[13px] font-medium" }, ma = {
	key: 0,
	class: "shrink-0 inline-flex items-center rounded-full bg-unraid-green-200 px-1.5 py-0.5 text-[10px] font-semibold text-unraid-green-800",
	title: "This container's IPv4 falls within the configured subnet."
}, ha = { class: "shrink-0 font-mono text-xs text-muted-foreground" }, ga = { class: "mt-3 grid grid-cols-2 gap-3" }, _a = ["title"], va = { class: "mt-1 flex items-center gap-2" }, ya = { class: "h-1.5 w-16 overflow-hidden rounded-full bg-muted" }, ba = { class: "font-mono text-[13px]" }, xa = {
	key: 0,
	viewBox: "0 0 80 24",
	width: "60",
	height: "18",
	class: "text-primary",
	preserveAspectRatio: "none"
}, Sa = ["points"], Ca = { class: "mt-1 flex items-center gap-2" }, wa = { class: "font-mono text-[13px]" }, Ta = {
	key: 0,
	viewBox: "0 0 80 24",
	width: "60",
	height: "18",
	class: "text-primary",
	preserveAspectRatio: "none"
}, Ea = ["points"], Da = {
	key: 0,
	class: "mt-1 h-1 w-20 overflow-hidden rounded-full bg-muted"
}, Oa = { class: "mt-3 flex flex-wrap gap-2" }, ka = {
	key: 0,
	class: "mt-3 rounded-md border border-border bg-muted/30 p-3"
}, Aa = {
	key: 0,
	class: "text-xs text-muted-foreground"
}, ja = { class: "grid grid-cols-2 gap-3 sm:grid-cols-4" }, Ma = { class: "mt-1 font-mono text-xs" }, Na = { class: "mt-1 font-mono text-xs" }, Pa = { class: "mt-1 font-mono text-xs" }, Fa = { class: "mt-1 font-mono text-xs" }, Ia = { class: "mt-4 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2" }, La = { class: "flex flex-wrap items-end gap-2" }, Ra = { class: "flex gap-1.5" }, za = { class: "flex gap-1.5" }, Ba = { class: "flex gap-2" }, Va = {
	key: 0,
	class: "mt-3 flex flex-wrap items-center gap-3 rounded-md border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs"
}, Ha = {
	key: 1,
	class: "mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Ua = { class: "mt-4 border-t border-border pt-3" }, Wa = { class: "mb-1 flex items-center gap-1.5 text-xs font-medium" }, Ga = { class: "mt-4 border-t border-border pt-3" }, Ka = { class: "flex flex-wrap gap-2" }, qa = {
	key: 0,
	class: "mt-1.5 text-xs text-unraid-green-800"
}, Ja = {
	key: 1,
	class: "mt-1.5 text-xs text-destructive"
}, Ya = { class: "mt-4 border-t border-border pt-3" }, Xa = { class: "flex flex-wrap gap-2" }, Za = {
	key: 0,
	class: "mt-2"
}, Qa = {
	key: 0,
	class: "mt-1 max-h-40 overflow-auto rounded-md border border-neutral-800 bg-neutral-950 p-2 text-[11px] whitespace-pre-wrap text-neutral-200"
}, $a = {
	key: 4,
	id: "incus-panel-config",
	role: "tabpanel",
	"aria-labelledby": "incus-tab-config",
	tabindex: "0"
}, eo = { class: "columns-1 gap-4 xl:columns-2" }, to = { class: "mb-4 break-inside-avoid rounded-lg border border-border bg-card p-4" }, no = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, ro = { class: "mt-4 border-t border-border pt-4" }, io = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, ao = { class: "mb-4 break-inside-avoid rounded-lg border border-border bg-card p-4" }, oo = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, so = { class: "mt-4 border-t border-border pt-4" }, co = {
	key: 0,
	class: "mb-2 flex flex-wrap gap-1.5"
}, lo = ["aria-label", "onClick"], uo = { class: "flex gap-2" }, fo = {
	key: 1,
	class: "mt-1.5 text-xs text-destructive"
}, po = { class: "mt-4" }, mo = {
	key: 0,
	class: "mb-2 flex flex-wrap gap-1.5"
}, ho = ["aria-label", "onClick"], go = { class: "flex gap-2" }, _o = {
	key: 1,
	class: "mt-1.5 text-xs text-destructive"
}, vo = { class: "mt-4 border-t border-border pt-4" }, yo = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, bo = { class: "flex justify-self-end gap-2" }, xo = { class: "mb-4 break-inside-avoid rounded-lg border border-border bg-card p-4" }, So = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, Co = {
	key: 0,
	class: "col-span-2 -mt-2 text-xs text-destructive"
}, wo = {
	key: 1,
	class: "col-span-2 -mt-2 text-xs text-destructive"
}, To = { class: "mt-4 border-t border-border pt-4" }, Eo = { class: "mb-8 flex justify-end" }, Do = 5e3, Oo = "__other__", ko = "__other__", Ao = 400, jo = /* @__PURE__ */ lt(/* @__PURE__ */ F({
	__name: "App",
	setup(e) {
		let n = De(() => import("./incus-settings-Terminal-DLA3-l2Z.js")), r = v("jails"), i = v(!0), s = v(!1), c = v(null), u = v(!1), d = v(null), p = k(() => u.value && d.value?.status === "degraded"), _ = v([]), y = v(""), te = k(() => yt(y.value)), x = k(() => gt(w.jailCpu)), ne = k(() => vt(w.jailMemory)), re = v(""), S = v(!1), ie = v(null), w = f({
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
		}), { runningJails: ae, stoppedJailsCount: oe, totalMemoryUsageBytes: se, totalCpuUsageNs: ce, fleetHistory: le, formatDuration: de, formatBytes: fe, formatMemory: pe, memoryFillPct: me, updateCpuSamplesAndHistory: ge, cpuRateLabel: ve, cpuRatePct: ye, cpuRateSuffix: be, jailCpuHistory: xe, totalCpuRateLabel: Se, sparklinePoints: Ce } = Sn(_, () => w.jailCpu), we = k(() => w.storageDriver === "zfs"), Te = v(!1), Oe = v(""), ke = v(!1), F = !1;
		async function Ae() {
			let e = await N(Cn);
			F && (Object.assign(w, e.incusConfig), w.jailIpv6 = "none");
		}
		let je = 0;
		async function I() {
			let e = ++je;
			try {
				let t = await N(wn);
				if (e !== je) return;
				u.value = t.incusHealthy, d.value = t.incusPluginHealth ?? null, _.value = t.jails, ge();
			} catch {
				if (e !== je) return;
				u.value = !1, d.value = null;
			}
		}
		a(async () => {
			F = !0;
			try {
				if (await Ae(), !F || (await I(), !F)) return;
				await Promise.all([us(), _s()]);
			} catch (e) {
				if (!F) return;
				c.value = e instanceof Error ? e.message : String(e);
			} finally {
				F && (i.value = !1);
			}
			F && r.value === "jails" && Ft();
		}), m(r, (e) => {
			e === "jails" ? (I(), Ft()) : It();
		});
		async function Me() {
			s.value = !0, c.value = null;
			try {
				let e = xn(w, {
					replacement: Oe.value,
					clear: ke.value
				});
				await N(Tn, { input: e }), (ke.value || Oe.value) && (w.tsAuthKeyConfigured = !ke.value, Oe.value = "", ke.value = !1), await I();
			} catch (e) {
				c.value = e instanceof Error ? e.message : String(e);
			} finally {
				s.value = !1;
			}
		}
		async function Ne(e, t) {
			c.value = null;
			try {
				await N(En, {
					name: e,
					action: t
				}), await I();
			} catch (e) {
				c.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function Pe(e) {
			if (confirm(`Delete container "${e}"? This cannot be undone.`)) {
				c.value = null;
				try {
					await N(Dn, { name: e }), await I();
				} catch (e) {
					c.value = e instanceof Error ? e.message : String(e);
				}
			}
		}
		let L = v(!1);
		async function Fe() {
			if (confirm("Delete every stopped container? Running containers are never touched. This cannot be undone.")) {
				L.value = !0, c.value = null;
				try {
					(await N("mutation { deleteStoppedJails }")).deleteStoppedJails.length === 0 && (c.value = "No stopped containers to delete."), await I();
				} catch (e) {
					c.value = e instanceof Error ? e.message : String(e);
				} finally {
					L.value = !1;
				}
			}
		}
		async function Ie() {
			if (y.value.trim() && !te.value) {
				c.value = null;
				try {
					await N(On, {
						name: y.value.trim(),
						image: re.value || null,
						allowSudo: S.value
					}), y.value = "", S.value = !1, await I();
				} catch (e) {
					c.value = e instanceof Error ? e.message : String(e);
				}
			}
		}
		let R = v(!1), { detailsJailName: z, jailDetail: B, detailLoading: Le, detailError: V, editCpuLimit: Re, editMemoryLimit: ze, editWorkspacePath: Be, toggleJailDetails: Ve, loadJailDetail: He } = Yn(() => {
			tt(), Ze.value = !1, ct(), ot.value = !1, Xe.value = "", Qe.value = "", $e.value = "", at.value = "", U.value = null;
		});
		async function Ue() {
			if (!z.value) return;
			let e = gt(Re.value);
			if (e) V.value = e;
			else {
				R.value = !0, V.value = "";
				try {
					await N(Fn, {
						name: z.value,
						cpu: Re.value.trim()
					}), await He(z.value);
				} catch (e) {
					V.value = e instanceof Error ? e.message : String(e);
				} finally {
					R.value = !1;
				}
			}
		}
		async function We() {
			if (!z.value) return;
			let e = vt(ze.value);
			if (e) V.value = e;
			else {
				R.value = !0, V.value = "";
				try {
					await N(Fn, {
						name: z.value,
						memory: ze.value.trim()
					}), await He(z.value);
				} catch (e) {
					V.value = e instanceof Error ? e.message : String(e);
				} finally {
					R.value = !1;
				}
			}
		}
		async function Ge() {
			if (z.value) {
				Re.value = "", ze.value = "", R.value = !0, V.value = "";
				try {
					await N(Fn, {
						name: z.value,
						cpu: "",
						memory: ""
					}), await He(z.value);
				} catch (e) {
					V.value = e instanceof Error ? e.message : String(e);
				} finally {
					R.value = !1;
				}
			}
		}
		async function Ke() {
			if (z.value && Be.value.trim()) {
				R.value = !0, V.value = "";
				try {
					await N(Nn, {
						name: z.value,
						hostPath: Be.value.trim()
					}), await He(z.value);
				} catch (e) {
					V.value = e instanceof Error ? e.message : String(e);
				} finally {
					R.value = !1;
				}
			}
		}
		async function qe() {
			if (z.value) {
				R.value = !0, V.value = "";
				try {
					await N(Pn, { name: z.value }), await He(z.value);
				} catch (e) {
					V.value = e instanceof Error ? e.message : String(e);
				} finally {
					R.value = !1;
				}
			}
		}
		function Je(e) {
			return !e.workspaceIsOverride && !!e.workspaceHostPath?.endsWith("/default-workspace");
		}
		let H = v(!1);
		async function Ye() {
			if (z.value) {
				H.value = !0, V.value = "";
				try {
					await N(Kn, { name: z.value }), await He(z.value);
				} catch (e) {
					V.value = e instanceof Error ? e.message : String(e);
				} finally {
					H.value = !1;
				}
			}
		}
		let Xe = v(""), Ze = v(!1), Qe = v(""), $e = v(""), et = null;
		function tt() {
			et !== null && (et.stop(), et = null);
		}
		async function nt() {
			if (!z.value || !Xe.value.trim()) return;
			let e = z.value;
			tt(), Ze.value = !0, Qe.value = "", $e.value = "";
			try {
				let t = (await N(qn, {
					name: e,
					formula: Xe.value.trim()
				})).installHomebrewFormula;
				et = bn(async (n) => {
					try {
						let r = await N(Jn, { id: t });
						if (!n.isActive() || z.value !== e) return;
						let i = r.homebrewInstallStatus;
						if (!i || i.status === "running") return;
						tt(), Ze.value = !1, i.status === "success" ? (Qe.value = i.message, Xe.value = "") : $e.value = i.message;
					} catch (t) {
						if (!n.isActive() || z.value !== e) return;
						tt(), Ze.value = !1, $e.value = t instanceof Error ? t.message : String(t);
					}
				}, yn);
			} catch (e) {
				$e.value = e instanceof Error ? e.message : String(e), Ze.value = !1;
			}
		}
		let rt = v(!1);
		async function it() {
			if (z.value) {
				rt.value = !0, V.value = "";
				try {
					await N(An, { name: z.value }), await He(z.value);
				} catch (e) {
					V.value = e instanceof Error ? e.message : String(e);
				} finally {
					rt.value = !1;
				}
			}
		}
		let at = v(""), ot = v(!1), U = v(null), st = null;
		function ct() {
			st !== null && (st.stop(), st = null);
		}
		async function lt() {
			if (z.value && at.value.trim()) {
				ct(), ot.value = !0, U.value = null, V.value = "";
				try {
					let e = (await N(jn, {
						name: z.value,
						command: at.value.trim()
					})).startPrivilegedCommand, t = z.value;
					st = bn(async (n) => {
						try {
							let r = await N(Mn, { id: e });
							if (!n.isActive() || z.value !== t) return;
							let i = r.privilegedCommandStatus;
							if (!i || i.status === "running") return;
							ct(), ot.value = !1, U.value = i;
						} catch (e) {
							if (!n.isActive() || z.value !== t) return;
							ct(), ot.value = !1, V.value = e instanceof Error ? e.message : String(e);
						}
					}, yn);
				} catch (e) {
					V.value = e instanceof Error ? e.message : String(e), ot.value = !1;
				}
			}
		}
		function ut(e) {
			let t = e.toLowerCase();
			return t === "running" ? "green" : t === "stopped" ? "gray" : "orange";
		}
		function dt(e) {
			return e.split(",").map((e) => e.trim()).filter((e) => e.length > 0);
		}
		function ft() {
			return dt(w.aclBlock).length;
		}
		let pt = /^[0-9a-fA-F:.]+\/\d{1,3}$/, mt = /^\d+(-\d+)?(,\d+(-\d+)?)*$/, W = /^\d+(\.\d+)?(B|KB|MB|GB|TB|PB|KiB|MiB|GiB|TiB|PiB)?$/i, ht = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
		function gt(e) {
			return e.trim() ? mt.test(e.trim()) ? "" : `"${e}" doesn't look like a CPU limit — expected a core count (e.g. 2) or a set/range (e.g. 0-3).` : "";
		}
		function vt(e) {
			return e.trim() ? W.test(e.trim()) ? "" : `"${e}" doesn't look like a memory limit — expected a byte count with an optional unit (e.g. 4GiB).` : "";
		}
		function yt(e) {
			return e.trim() ? ht.test(e.trim()) ? "" : `"${e}" isn't a valid container name — letters, digits, and hyphens only, can't start or end with a hyphen.` : "";
		}
		let bt = k(() => dt(w.aclBlock)), xt = k(() => dt(w.aclAllow)), St = v(""), Ct = v(""), G = v(""), wt = v("");
		function Tt() {
			let e = St.value.trim();
			G.value = "", e && (pt.test(e) ? bt.value.includes(e) ? G.value = `${e} is already in the list.` : (w.aclBlock = [...bt.value, e].join(","), St.value = "") : G.value = `"${e}" doesn't look like a CIDR — expected e.g. 10.0.0.0/8 or fd00::/8.`);
		}
		function Et(e) {
			w.aclBlock = bt.value.filter((t) => t !== e).join(",");
		}
		function Dt() {
			let e = Ct.value.trim();
			wt.value = "", e && (pt.test(e) ? xt.value.includes(e) ? wt.value = `${e} is already in the list.` : (w.aclAllow = [...xt.value, e].join(","), Ct.value = "") : wt.value = `"${e}" doesn't look like a CIDR — expected e.g. 100.64.0.0/10 or fd00::/8.`);
		}
		function Ot(e) {
			w.aclAllow = xt.value.filter((t) => t !== e).join(",");
		}
		function kt(e) {
			let t = e.split(".");
			if (t.length !== 4) return null;
			let n = 0;
			for (let e of t) {
				if (!/^\d{1,3}$/.test(e)) return null;
				let t = Number(e);
				if (t < 0 || t > 255) return null;
				n = n << 8 | t;
			}
			return n >>> 0;
		}
		function jt(e, t) {
			let [n, r] = t.split("/");
			if (!n || r === void 0) return !1;
			let i = Number(r);
			if (!Number.isInteger(i) || i < 0 || i > 32) return !1;
			let a = kt(e), o = kt(n);
			if (a === null || o === null) return !1;
			if (i === 0) return !0;
			let s = 4294967295 << 32 - i >>> 0;
			return (a & s) === (o & s);
		}
		function Nt(e) {
			return !e.ipv4 || !w.jailSubnet || e.status.toLowerCase() !== "running" ? !1 : jt(e.ipv4, w.jailSubnet);
		}
		let Pt = null;
		function Ft() {
			It(), Pt = bn(I, Do);
		}
		function It() {
			Pt !== null && (Pt.stop(), Pt = null);
		}
		let Lt = [
			{
				value: "debian",
				label: "Debian"
			},
			{
				value: "ubuntu",
				label: "Ubuntu"
			},
			{
				value: "alpinelinux",
				label: "Alpine Linux"
			},
			{
				value: "rockylinux",
				label: "Rocky Linux"
			},
			{
				value: "almalinux",
				label: "AlmaLinux"
			},
			{
				value: "fedora",
				label: "Fedora"
			}
		], Rt = {
			debian: [
				{
					value: "bookworm",
					label: "Bookworm (12, oldstable)"
				},
				{
					value: "trixie",
					label: "Trixie (13, stable)"
				},
				{
					value: "sid",
					label: "Sid (unstable)"
				}
			],
			ubuntu: [
				{
					value: "jammy",
					label: "Jammy (22.04 LTS)"
				},
				{
					value: "noble",
					label: "Noble (24.04 LTS)"
				},
				{
					value: "resolute",
					label: "Resolute (26.04 LTS)"
				}
			],
			alpinelinux: [
				{
					value: "3.21",
					label: "3.21"
				},
				{
					value: "3.22",
					label: "3.22"
				},
				{
					value: "3.23",
					label: "3.23"
				},
				{
					value: "3.24",
					label: "3.24 (latest stable)"
				},
				{
					value: "edge",
					label: "Edge (rolling)"
				}
			],
			rockylinux: [{
				value: "9",
				label: "9"
			}, {
				value: "10",
				label: "10 (latest)"
			}],
			almalinux: [{
				value: "9",
				label: "9"
			}, {
				value: "10",
				label: "10 (latest)"
			}],
			fedora: [{
				value: "41",
				label: "41"
			}, {
				value: "44",
				label: "44 (latest)"
			}]
		}, zt = {
			debian: [
				{
					key: "build-tools",
					label: "Build tools",
					packages: ["build-essential"]
				},
				{
					key: "git",
					label: "Git",
					packages: ["git"]
				},
				{
					key: "python3",
					label: "Python 3",
					packages: [
						"python3",
						"python3-pip",
						"python3-venv"
					]
				},
				{
					key: "nodejs",
					label: "Node.js",
					packages: ["nodejs", "npm"]
				},
				{
					key: "curl",
					label: "curl",
					packages: ["curl"]
				},
				{
					key: "openssh-server",
					label: "OpenSSH server",
					packages: ["openssh-server"]
				},
				{
					key: "sudo",
					label: "sudo",
					packages: ["sudo"]
				},
				{
					key: "ca-certificates",
					label: "CA certificates",
					packages: ["ca-certificates"]
				}
			],
			ubuntu: [
				{
					key: "build-tools",
					label: "Build tools",
					packages: ["build-essential"]
				},
				{
					key: "git",
					label: "Git",
					packages: ["git"]
				},
				{
					key: "python3",
					label: "Python 3",
					packages: [
						"python3",
						"python3-pip",
						"python3-venv"
					]
				},
				{
					key: "nodejs",
					label: "Node.js",
					packages: ["nodejs", "npm"]
				},
				{
					key: "curl",
					label: "curl",
					packages: ["curl"]
				},
				{
					key: "openssh-server",
					label: "OpenSSH server",
					packages: ["openssh-server"]
				},
				{
					key: "sudo",
					label: "sudo",
					packages: ["sudo"]
				},
				{
					key: "ca-certificates",
					label: "CA certificates",
					packages: ["ca-certificates"]
				}
			],
			alpinelinux: [
				{
					key: "build-tools",
					label: "Build tools",
					packages: ["build-base"]
				},
				{
					key: "git",
					label: "Git",
					packages: ["git"]
				},
				{
					key: "python3",
					label: "Python 3",
					packages: ["python3", "py3-pip"]
				},
				{
					key: "curl",
					label: "curl",
					packages: ["curl"]
				},
				{
					key: "openssh-server",
					label: "OpenSSH server",
					packages: ["openssh"]
				},
				{
					key: "sudo",
					label: "sudo",
					packages: ["sudo"]
				},
				{
					key: "ca-certificates",
					label: "CA certificates",
					packages: ["ca-certificates"]
				}
			],
			rockylinux: [
				{
					key: "build-tools",
					label: "Build tools",
					packages: [
						"gcc",
						"gcc-c++",
						"make"
					]
				},
				{
					key: "git",
					label: "Git",
					packages: ["git"]
				},
				{
					key: "python3",
					label: "Python 3",
					packages: ["python3", "python3-pip"]
				},
				{
					key: "curl",
					label: "curl",
					packages: ["curl"]
				},
				{
					key: "openssh-server",
					label: "OpenSSH server",
					packages: ["openssh-server"]
				},
				{
					key: "sudo",
					label: "sudo",
					packages: ["sudo"]
				},
				{
					key: "ca-certificates",
					label: "CA certificates",
					packages: ["ca-certificates"]
				}
			],
			almalinux: [
				{
					key: "build-tools",
					label: "Build tools",
					packages: [
						"gcc",
						"gcc-c++",
						"make"
					]
				},
				{
					key: "git",
					label: "Git",
					packages: ["git"]
				},
				{
					key: "python3",
					label: "Python 3",
					packages: ["python3", "python3-pip"]
				},
				{
					key: "curl",
					label: "curl",
					packages: ["curl"]
				},
				{
					key: "openssh-server",
					label: "OpenSSH server",
					packages: ["openssh-server"]
				},
				{
					key: "sudo",
					label: "sudo",
					packages: ["sudo"]
				},
				{
					key: "ca-certificates",
					label: "CA certificates",
					packages: ["ca-certificates"]
				}
			],
			fedora: [
				{
					key: "build-tools",
					label: "Build tools",
					packages: [
						"gcc",
						"gcc-c++",
						"make"
					]
				},
				{
					key: "git",
					label: "Git",
					packages: ["git"]
				},
				{
					key: "python3",
					label: "Python 3",
					packages: ["python3", "python3-pip"]
				},
				{
					key: "curl",
					label: "curl",
					packages: ["curl"]
				},
				{
					key: "openssh-server",
					label: "OpenSSH server",
					packages: ["openssh-server"]
				},
				{
					key: "sudo",
					label: "sudo",
					packages: ["sudo"]
				},
				{
					key: "ca-certificates",
					label: "CA certificates",
					packages: ["ca-certificates"]
				}
			]
		}, K = v("debian"), q = v(""), Bt = v(""), J = v(""), Vt = k(() => K.value === Oo), Ht = k(() => q.value === ko), Ut = k(() => Vt.value ? Bt.value : K.value), Wt = k(() => Ht.value ? J.value : q.value), Gt = k(() => Rt[K.value] ?? []);
		m(K, () => {
			let e = Rt[K.value];
			q.value = e && e.length > 0 ? e[0].value : ko, J.value = "";
		});
		{
			let e = Rt[K.value];
			q.value = e && e.length > 0 ? e[0].value : ko;
		}
		let Kt = v(""), qt = v(""), Jt = v(!1), Yt = v(null), Xt = v([]), Zt = v(null), Qt = v(!1);
		function $t(e) {
			return e.split(/[\n,]/).map((e) => e.trim()).filter((e) => e.length > 0);
		}
		function en() {
			let e = $t(Kt.value);
			return Array.from(/* @__PURE__ */ new Set([...Array.from(Y), ...e]));
		}
		let tn = v(""), nn = v([]), rn = v([]), an = v(!1), on = v(null), sn = null, ln = 0, Y = f(/* @__PURE__ */ new Set()), X = f(/* @__PURE__ */ new Map()), un = {
			apt: "apt",
			npm: "npm",
			pypi: "PyPI",
			brew: "brew"
		};
		function dn() {
			sn && clearTimeout(sn), sn = null, ++ln, tn.value.trim().length < 2 ? (nn.value = [], rn.value = [], on.value = null) : sn = setTimeout(fn, Ao);
		}
		m(tn, dn), m(K, () => {
			Y.clear(), X.clear(), dn();
		});
		async function fn() {
			let e = tn.value.trim();
			if (e.length < 2) return;
			let t = ln;
			an.value = !0, on.value = null;
			try {
				let n = await N(Rn, {
					query: e,
					distro: Ut.value,
					release: Wt.value
				});
				if (t !== ln) return;
				nn.value = n.searchAllPackages.results, rn.value = n.searchAllPackages.errors;
			} catch (e) {
				if (t !== ln) return;
				on.value = e instanceof Error ? e.message : String(e), nn.value = [], rn.value = [];
			} finally {
				t === ln && (an.value = !1);
			}
		}
		function mn(e) {
			Y.add(e.name);
		}
		function hn(e) {
			Y.delete(e);
		}
		function gn(e) {
			let t = zt[K.value]?.find((t) => t.key === e);
			if (t) for (let e of t.packages) Y.add(e);
		}
		function _n(e) {
			gn("nodejs"), X.set(`npm:${e.name}`, `npm install -g ${e.name}`);
		}
		function kn(e) {
			gn("python3"), X.set(`pypi:${e.name}`, `pip3 install ${e.name}`);
		}
		function jo(e) {
			X.delete(e);
		}
		function Mo(e) {
			e.ecosystem === "apt" ? mn(e) : e.ecosystem === "npm" ? _n(e) : e.ecosystem === "pypi" && kn(e);
		}
		function No(e) {
			return e.ecosystem === "apt" ? Y.has(e.name) : e.ecosystem === "npm" ? X.has(`npm:${e.name}`) : e.ecosystem === "pypi" && X.has(`pypi:${e.name}`);
		}
		function Po(e, t) {
			Lt.some((t) => t.value === e) ? (K.value = e, (Rt[e] ?? []).some((e) => e.value === t) ? (q.value = t, J.value = "") : (q.value = ko, J.value = t)) : (K.value = Oo, Bt.value = e, q.value = ko, J.value = t);
		}
		function Fo() {
			Zt.value = null;
		}
		function Io(e) {
			let t = e.toLowerCase(), n = (e) => e.find((e) => t.includes(e));
			if (t.includes("alpine")) {
				let e = t.match(/(\d+\.\d+)/)?.[1];
				return {
					distro: "alpinelinux",
					release: e && Rt.alpinelinux.some((t) => t.value === e) ? e : "3.24"
				};
			}
			if (t.includes("fedora")) {
				let e = t.match(/fedora[:\-](\d+)/)?.[1];
				return {
					distro: "fedora",
					release: e && Rt.fedora.some((t) => t.value === e) ? e : "44"
				};
			}
			if (t.includes("rockylinux") || t.includes("rocky")) {
				let e = t.match(/(\d+)/)?.[1];
				return {
					distro: "rockylinux",
					release: e === "9" || e === "10" ? e : "10"
				};
			}
			if (t.includes("almalinux") || t.includes("alma")) {
				let e = t.match(/(\d+)/)?.[1];
				return {
					distro: "almalinux",
					release: e === "9" || e === "10" ? e : "10"
				};
			}
			let r = n([
				"jammy",
				"noble",
				"resolute",
				"focal",
				"bionic"
			]);
			if (t.includes("ubuntu") || r) return {
				distro: "ubuntu",
				release: r && Rt.ubuntu.some((e) => e.value === r) ? r : "noble"
			};
			let i = n([
				"bookworm",
				"trixie",
				"sid",
				"bullseye",
				"buster"
			]);
			return t.includes("debian") || i || t.startsWith("node:") || t.startsWith("python:") || t.includes("/node") || t.includes("/python") ? {
				distro: "debian",
				release: i && Rt.debian.some((e) => e.value === i) ? i : "bookworm"
			} : null;
		}
		function Lo(e) {
			let t = e.toLowerCase();
			return t.includes("/node") ? "nodejs" : t.includes("/python") ? "python3" : null;
		}
		function Ro(e) {
			let t = JSON.parse(zo(e)), n = {
				distroSet: !1,
				packagesAdded: [],
				commandsAdded: [],
				skipped: []
			};
			if (Fo(), Y.clear(), X.clear(), Kt.value = "", typeof t.image == "string") {
				let e = Io(t.image);
				e ? (Po(e.distro, e.release), n.distroSet = !0) : n.skipped.push(`image "${t.image}" — couldn't infer a matching distro/release, pick manually`);
			} else t.build && n.skipped.push("\"build.dockerfile\" — Dockerfile-based devcontainers aren't translated, pick a distro/release manually");
			if (t.features && typeof t.features == "object") for (let e of Object.keys(t.features)) {
				let t = Lo(e);
				if (t) {
					let e = zt[K.value]?.find((e) => e.key === t);
					if (e) {
						for (let t of e.packages) Y.has(t) || (Y.add(t), n.packagesAdded.push(t));
						continue;
					}
				}
				if (e.includes("/git")) Y.has("git") || (Y.add("git"), n.packagesAdded.push("git"));
				else if (e.includes("/common-utils")) for (let e of [
					"curl",
					"sudo",
					"ca-certificates"
				]) Y.has(e) || (Y.add(e), n.packagesAdded.push(e));
				else n.skipped.push(`feature "${e}" — not recognized, add its packages manually if needed`);
			}
			let r = [["postCreateCommand", t.postCreateCommand], ["postStartCommand", t.postStartCommand]];
			for (let [e, t] of r) t && (Array.isArray(t) ? t.map(String) : [String(t)]).forEach((t, r) => {
				let i = `devcontainer:${e}:${r}`;
				X.set(i, t), n.commandsAdded.push(t);
			});
			return (t.remoteUser || t.containerUser) && n.skipped.push(`remoteUser/containerUser "${t.remoteUser ?? t.containerUser}" — not mapped, this plugin uses one fixed agent user (Config → Jail Defaults)`), (t.forwardPorts || t.mounts || t.workspaceFolder) && n.skipped.push("forwardPorts/mounts/workspaceFolder — IDE/runtime concerns, not applicable to image building"), n;
		}
		function zo(e) {
			return e.replace(/\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1");
		}
		let Bo = v(null), Vo = v(null), Ho = v(null);
		function Uo() {
			Ho.value?.click();
		}
		function Wo(e) {
			let t = e.target.files?.[0];
			if (!t) return;
			Bo.value = null, Vo.value = null;
			let n = new FileReader();
			n.onload = () => {
				try {
					Vo.value = Ro(String(n.result));
				} catch (e) {
					Bo.value = e instanceof Error ? e.message : String(e);
				}
			}, n.onerror = () => {
				Bo.value = "Failed to read the file.";
			}, n.readAsText(t), e.target.value = "";
		}
		function Go(e) {
			let t = e?.tools;
			if (!t || typeof t != "object") return [];
			let n = [];
			for (let [e, r] of Object.entries(t)) typeof r == "string" ? n.push({
				tool: e,
				version: r
			}) : Array.isArray(r) && typeof r[0] == "string" ? n.push({
				tool: e,
				version: r[0]
			}) : r && typeof r == "object" && typeof r.version == "string" && n.push({
				tool: e,
				version: r.version
			});
			return n;
		}
		function Ko(e) {
			let t = [];
			for (let n of e.split("\n")) {
				let e = n.split("#")[0].trim();
				if (!e) continue;
				let [r, i] = e.split(/\s+/);
				r && i && t.push({
					tool: r,
					version: i
				});
			}
			return t;
		}
		function qo() {
			gn("build-tools"), Y.has("curl") || Y.add("curl"), Y.has("ca-certificates") || Y.add("ca-certificates"), X.set("mise:env", "export MISE_DATA_DIR=/opt/mise MISE_CONFIG_DIR=/etc/mise"), X.set("mise:install", "curl https://mise.run | MISE_INSTALL_PATH=/usr/local/bin/mise sh"), X.set("mise:profile", "printf 'export MISE_DATA_DIR=/opt/mise MISE_CONFIG_DIR=/etc/mise\\neval \"$(/usr/local/bin/mise activate bash)\"\\n' > /etc/profile.d/mise.sh && chmod +x /etc/profile.d/mise.sh");
		}
		function Jo(e) {
			if (e.length === 0) return [];
			qo();
			let t = e.map((e) => `${e.tool}@${e.version}`);
			return X.set("mise:use-tools", `mise use -g ${t.join(" ")}`), t;
		}
		async function Yo(e) {
			let t = Go((await import("./incus-settings-dist-D2zpBM3p.js")).parse(e));
			if (t.length === 0) throw Error("No [tools] entries found in this mise.toml.");
			return { toolsAdded: Jo(t) };
		}
		function Xo(e) {
			let t = Ko(e);
			if (t.length === 0) throw Error("No tool/version lines found in this .tool-versions file.");
			return { toolsAdded: Jo(t) };
		}
		let Zo = v(null), Qo = v(null), $o = v(null), es = v(null);
		function ts(e, t) {
			let n = e.target.files?.[0];
			if (!n) return;
			Zo.value = null, Qo.value = null;
			let r = new FileReader();
			r.onload = async () => {
				try {
					let e = t === "toml" ? await Yo(String(r.result)) : Xo(String(r.result));
					Qo.value = e.toolsAdded;
				} catch (e) {
					Zo.value = e instanceof Error ? e.message : String(e);
				}
			}, r.onerror = () => {
				Zo.value = "Failed to read the file.";
			}, r.readAsText(n), e.target.value = "";
		}
		let ns = v(""), rs = v("");
		function is() {
			let e = ns.value.trim();
			if (!e) return;
			qo(), Y.has("git") || Y.add("git");
			let t = rs.value.trim(), n = t ? `git clone --depth 1 --branch ${t} ${e} /opt/dotfiles-src` : `git clone --depth 1 ${e} /opt/dotfiles-src`;
			X.set("mise:dotfiles-clone", n), X.set("mise:dotfiles-bootstrap", "cp /opt/dotfiles-src/mise.toml /opt/dotfiles-src/.mise.toml /etc/mise/config.d/dotfiles.toml 2>/dev/null; MISE_EXPERIMENTAL=1 mise bootstrap --yes || true");
		}
		function as() {
			X.delete("mise:dotfiles-clone"), X.delete("mise:dotfiles-bootstrap"), ns.value = "", rs.value = "";
		}
		let os = v([]), ss = v(""), cs = v(!1), ls = v(null);
		async function us() {
			let e = await N(Bn);
			F && (os.value = e.builderPresets);
		}
		async function ds() {
			let e = ss.value.trim();
			if (e) {
				ls.value = null, cs.value = !0;
				try {
					await N(Vn, { input: {
						name: e,
						distro: Ut.value.trim(),
						release: Wt.value.trim(),
						packages: en()
					} }), ss.value = "", await us();
				} catch (e) {
					ls.value = e instanceof Error ? e.message : String(e);
				} finally {
					cs.value = !1;
				}
			}
		}
		function fs(e) {
			Po(e.distro, e.release), Kt.value = e.packages.join("\n"), qt.value = "", Fo();
		}
		async function ps(e) {
			ls.value = null;
			try {
				await N(Hn, { name: e }), await us();
			} catch (e) {
				ls.value = e instanceof Error ? e.message : String(e);
			}
		}
		let ms = v([]), hs = v(null), gs = v(null);
		async function _s() {
			let e = await N(Un);
			F && (ms.value = e.jailImages);
		}
		async function vs(e) {
			if (e.isMaster) return;
			hs.value = null, gs.value = e.alias;
			let t = ms.value.find((e) => e.isMaster)?.alias ?? null;
			try {
				await N(Wn, {
					alias: e.alias,
					isMaster: !0
				}), await N(Tn, { input: { jailImage: e.alias } }), await Promise.all([_s(), Ae()]);
			} catch (n) {
				await Promise.allSettled([t ? N(Wn, {
					alias: t,
					isMaster: !0
				}) : N(Wn, {
					alias: e.alias,
					isMaster: !1
				})]), await Promise.allSettled([_s(), Ae()]), hs.value = n instanceof Error ? n.message : String(n);
			} finally {
				gs.value = null;
			}
		}
		function ys(e) {
			Po(e.distro, e.release), Kt.value = e.packages.join("\n"), qt.value = "", Zt.value = e.alias;
		}
		let bs = v(null);
		async function xs(e) {
			if (confirm(`Delete image "${e.alias}"? This removes it from Incus and cannot be undone.`)) {
				hs.value = null, bs.value = e.alias;
				try {
					await N(Ln, { alias: e.alias }), ms.value = ms.value.filter((t) => t.alias !== e.alias), Zt.value === e.alias && Fo();
				} catch (e) {
					hs.value = e instanceof Error ? e.message : String(e);
				} finally {
					bs.value = null;
				}
			}
		}
		function Ss(e) {
			return e.length === 0 ? "no packages" : e.join(", ");
		}
		let Cs = v(!1), ws = v("");
		async function Ts() {
			Cs.value = !0, hs.value = null, ws.value = "";
			try {
				let e = await N(Gn);
				e.pruneStaleImageRecords.length === 0 ? ws.value = "Nothing to prune — every saved image still exists in Incus." : (ws.value = `Untracked ${e.pruneStaleImageRecords.length}: ${e.pruneStaleImageRecords.join(", ")}`, ms.value = ms.value.filter((t) => !e.pruneStaleImageRecords.includes(t.alias)));
			} catch (e) {
				hs.value = e instanceof Error ? e.message : String(e);
			} finally {
				Cs.value = !1;
			}
		}
		function Es(e) {
			e.intervalId !== null && (e.intervalId.stop(), e.intervalId = null);
		}
		function Ds(e) {
			e.intervalId = bn(async (t) => {
				try {
					let n = await N(zn, { buildId: e.buildId });
					if (!t.isActive()) return;
					if (e.status = n.jailImageBuildStatus, e.status?.status === "success") {
						Es(e);
						try {
							await _s();
						} catch (e) {
							hs.value = e instanceof Error ? e.message : String(e);
						}
					} else e.status?.status === "failed" && Es(e);
				} catch (n) {
					if (!t.isActive()) return;
					e.error = n instanceof Error ? n.message : String(n), Es(e);
				}
			}, yn);
		}
		async function Os() {
			Yt.value = null;
			let e = Ut.value.trim(), t = Wt.value.trim(), n = qt.value.trim(), r = en();
			if (!e || !t || !n) Yt.value = "Distro, release, and alias are required.";
			else {
				Jt.value = !0;
				try {
					let i = {
						buildId: (await N(In, {
							distro: e,
							release: t,
							packages: r,
							alias: n,
							basedOn: Zt.value || null,
							postInstallCommands: Array.from(X.values())
						})).buildJailImage,
						distro: e,
						release: t,
						alias: n,
						status: null,
						error: null,
						intervalId: null
					};
					Xt.value.unshift(i), Ds(Xt.value[0]);
					let a = Rt[K.value];
					q.value = a && a.length > 0 ? a[0].value : ko, J.value = "", qt.value = "", Kt.value = "", Y.clear(), X.clear(), nn.value = [], tn.value = "", Qo.value = null, Zo.value = null, ns.value = "", rs.value = "", Fo();
				} catch (e) {
					Yt.value = e instanceof Error ? e.message : String(e);
				} finally {
					Jt.value = !1;
				}
			}
		}
		function ks(e) {
			switch (e) {
				case "success": return "green";
				case "failed": return "red";
				case "running": return "orange";
				default: return "gray";
			}
		}
		return ee(() => {
			F = !1, ++je, ++ln;
			for (let e of Xt.value) Es(e);
			It(), tt(), ct(), sn && clearTimeout(sn);
		}), (e, a) => (h(), j("div", Xn, [i.value ? (h(), j("div", Zn, "Loading incus configuration…")) : (h(), j(A, { key: 1 }, [
			c.value ? (h(), j("div", Qn, E(c.value), 1)) : D("", !0),
			p.value ? (h(), j("div", $n, [
				a[51] ||= P("p", { class: "font-semibold" }, "Container network setup did not finish.", -1),
				P("p", er, E(d.value?.message), 1),
				a[52] ||= P("p", { class: "mt-1 text-muted-foreground" }, " Running containers keep their last applied network settings, and recent changes to incus.cfg may not be in force. Fix the cause, then press Apply on the Config tab. The plugin also retries on its own. ", -1)
			])) : D("", !0),
			P("header", tr, [a[54] ||= ue("<svg width=\"14\" height=\"20\" viewBox=\"0 0 10 14\" fill=\"none\" aria-hidden=\"true\" class=\"shrink-0 text-foreground\"><path d=\"M5 0L9 2.5L5 5L1 2.5Z\" fill=\"currentColor\" opacity=\"0.95\"></path><path d=\"M5 3L9 5.5L5 8L1 5.5Z\" fill=\"currentColor\" opacity=\"0.7\"></path><path d=\"M5 6L9 8.5L5 11L1 8.5Z\" fill=\"currentColor\" opacity=\"0.45\"></path><path d=\"M5 9L9 11.5L5 14L1 11.5Z\" fill=\"currentColor\" opacity=\"0.25\"></path></svg><span class=\"text-sm font-semibold tracking-[0.14em] uppercase\">Incus</span><span class=\"text-xs text-muted-foreground\">dev containers</span>", 3), P("div", nr, [C(b(_e), { variant: p.value ? "orange" : u.value ? "green" : "red" }, {
				default: g(() => [O(E(p.value ? "Degraded" : u.value ? "Reachable" : "Not running"), 1)]),
				_: 1
			}, 8, ["variant"]), C(b(M), {
				size: "sm",
				variant: "outline",
				onClick: I
			}, {
				default: g(() => [...a[53] ||= [O("Refresh", -1)]]),
				_: 1
			})])]),
			C(vn, {
				modelValue: r.value,
				"onUpdate:modelValue": a[0] ||= (e) => r.value = e
			}, null, 8, ["modelValue"]),
			r.value === "builder" ? (h(), j("section", rr, [
				P("div", ir, [P("div", null, [a[79] ||= P("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Starting points", -1), P("div", ar, [
					a[78] ||= P("h3", { class: "mb-2 text-sm font-semibold" }, "Presets", -1),
					ls.value ? (h(), j("p", or, E(ls.value), 1)) : D("", !0),
					os.value.length === 0 ? (h(), j("p", sr, "Save the form below as a preset to reuse it later.")) : (h(), j("div", cr, [(h(!0), j(A, null, t(os.value, (e) => (h(), j("div", {
						key: e.name,
						class: "flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
					}, [
						P("button", {
							type: "button",
							class: "cursor-pointer font-medium hover:text-primary",
							onClick: (t) => fs(e)
						}, E(e.name), 9, lr),
						P("span", ur, E(e.distro) + "/" + E(e.release), 1),
						P("button", {
							type: "button",
							class: "cursor-pointer text-muted-foreground hover:text-destructive",
							"aria-label": "Delete preset",
							onClick: (t) => ps(e.name)
						}, "✕", 8, dr)
					]))), 128))])),
					P("div", fr, [
						C(b(Q), {
							for: "new-preset-name",
							class: "sr-only"
						}, {
							default: g(() => [...a[55] ||= [O("Preset name", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "new-preset-name",
							modelValue: ss.value,
							"onUpdate:modelValue": a[1] ||= (e) => ss.value = e,
							placeholder: "Preset name",
							class: "w-56"
						}, null, 8, ["modelValue"]),
						C(b(M), {
							size: "sm",
							variant: "outline",
							disabled: cs.value || !ss.value.trim(),
							onClick: ds
						}, {
							default: g(() => [O(E(cs.value ? "Saving…" : "Save as preset"), 1)]),
							_: 1
						}, 8, ["disabled"])
					]),
					C(b($), null, {
						default: g(() => [...a[56] ||= [O(" Saves distro, release, and the current package/tool list — not the alias, since that should stay unique per build. Saving under a name that already exists overwrites it. ", -1)]]),
						_: 1
					}),
					P("div", pr, [
						P("div", mr, [a[57] ||= P("h3", { class: "text-sm font-semibold" }, "Saved images", -1), ms.value.length > 0 ? (h(), T(b(M), {
							key: 0,
							size: "sm",
							variant: "outline",
							disabled: Cs.value,
							onClick: Ts
						}, {
							default: g(() => [O(E(Cs.value ? "Checking…" : "Prune stale records"), 1)]),
							_: 1
						}, 8, ["disabled"])) : D("", !0)]),
						hs.value ? (h(), j("p", hr, E(hs.value), 1)) : D("", !0),
						ws.value ? (h(), j("p", gr, E(ws.value), 1)) : D("", !0),
						ms.value.length === 0 ? (h(), j("p", _r, " No images built yet — the first one you build can become the golden master. ")) : (h(), j("div", vr, [(h(!0), j(A, null, t([...ms.value].sort((e, t) => +!!t.isMaster - !!e.isMaster), (e) => (h(), j("div", {
							key: e.alias,
							class: he(["flex items-center gap-3 rounded-md border px-3 py-2", e.isMaster ? "border-primary bg-primary/5" : "border-border"])
						}, [
							P("div", yr, [P("div", br, [
								P("span", xr, E(e.alias), 1),
								e.isMaster ? (h(), T(b(_e), {
									key: 0,
									variant: "orange"
								}, {
									default: g(() => [...a[58] ||= [O("Golden master", -1)]]),
									_: 1
								})) : D("", !0),
								P("span", Sr, E(e.distro) + "/" + E(e.release), 1)
							]), P("p", Cr, E(Ss(e.packages)), 1)]),
							C(b(M), {
								size: "sm",
								variant: "outline",
								disabled: e.isMaster || gs.value === e.alias,
								onClick: (t) => vs(e),
								title: e.isMaster ? "Current launch default; choose another image to replace it" : "New containers launch from this image by default"
							}, {
								default: g(() => [O(E(e.isMaster ? "Default" : "Set as default"), 1)]),
								_: 2
							}, 1032, [
								"disabled",
								"onClick",
								"title"
							]),
							C(b(M), {
								size: "sm",
								variant: "secondary",
								onClick: (t) => ys(e)
							}, {
								default: g(() => [...a[59] ||= [O("Build variant", -1)]]),
								_: 1
							}, 8, ["onClick"]),
							C(b(M), {
								size: "sm",
								variant: "destructive",
								disabled: bs.value === e.alias,
								onClick: (t) => xs(e)
							}, {
								default: g(() => [...a[60] ||= [O("Delete", -1)]]),
								_: 1
							}, 8, ["disabled", "onClick"])
						], 2))), 128))])),
						C(b($), null, {
							default: g(() => [...a[61] ||= [O(" Only one image can be the golden master at a time — marking a new one unmarks the previous. Marking it also sets it as the default image new containers launch from (Config → Container Defaults), so this is more than a label. \"Build variant\" pre-fills the form from that image's distro/release/packages so you can edit, extend, or strip it down before building a new one. \"Prune stale records\" checks every saved image still actually exists in Incus and untracks any that don't — useful if one was deleted directly via the incus CLI instead of through here. ", -1)]]),
							_: 1
						})
					]),
					P("div", wr, [P("button", {
						type: "button",
						"aria-expanded": Qt.value,
						"aria-controls": "config-import-panel",
						class: "flex w-full cursor-pointer items-center gap-1.5 text-left text-sm font-semibold",
						onClick: a[2] ||= (e) => Qt.value = !Qt.value
					}, [
						P("span", { class: he(["text-muted-foreground transition-transform", Qt.value ? "rotate-90" : ""]) }, "▸", 2),
						a[62] ||= O(" Import from a config file ", -1),
						a[63] ||= P("span", { class: "font-normal text-xs text-muted-foreground" }, "devcontainer.json, mise.toml, .tool-versions", -1)
					], 8, Tr), Qt.value ? (h(), j("div", Er, [
						P("div", null, [
							a[68] ||= P("p", { class: "mb-2 text-xs text-muted-foreground" }, " devcontainer.json — maps the base image and recognized features to real packages; anything that isn't applicable to image building is reported, not silently dropped. ", -1),
							P("input", {
								ref_key: "devcontainerFileInput",
								ref: Ho,
								type: "file",
								accept: ".json,application/json",
								class: "hidden",
								onChange: Wo
							}, null, 544),
							C(b(M), {
								size: "sm",
								variant: "outline",
								onClick: Uo
							}, {
								default: g(() => [...a[64] ||= [O("Choose devcontainer.json…", -1)]]),
								_: 1
							}),
							Bo.value ? (h(), j("p", Dr, E(Bo.value), 1)) : D("", !0),
							Vo.value ? (h(), j("div", Or, [
								Vo.value.distroSet ? (h(), j("p", kr, [...a[65] ||= [
									O("Distro/release set from ", -1),
									P("span", { class: "font-mono" }, "image", -1),
									O(".", -1)
								]])) : D("", !0),
								Vo.value.packagesAdded.length > 0 ? (h(), j("p", Ar, [a[66] ||= O(" Packages added: ", -1), P("span", jr, E(Vo.value.packagesAdded.join(", ")), 1)])) : D("", !0),
								Vo.value.commandsAdded.length > 0 ? (h(), j("p", Mr, E(Vo.value.commandsAdded.length) + " lifecycle command(s) added below — review before building. ", 1)) : D("", !0),
								Vo.value.skipped.length > 0 ? (h(), j("div", Nr, [a[67] ||= P("p", { class: "text-muted-foreground" }, "Skipped (review manually):", -1), P("ul", Pr, [(h(!0), j(A, null, t(Vo.value.skipped, (e) => (h(), j("li", { key: e }, E(e), 1))), 128))])])) : D("", !0)
							])) : D("", !0)
						]),
						P("div", Fr, [
							a[73] ||= P("p", { class: "mb-2 text-xs text-muted-foreground" }, [
								O(" mise.toml / .tool-versions — pins exact tool versions by baking in "),
								P("span", { class: "font-mono" }, "mise"),
								O(" itself as a post-install step, wired system-wide so the container's actual runtime user can use the tools too. ")
							], -1),
							P("input", {
								ref_key: "miseTomlFileInput",
								ref: $o,
								type: "file",
								accept: ".toml,application/toml",
								class: "hidden",
								onChange: a[3] ||= (e) => ts(e, "toml")
							}, null, 544),
							P("input", {
								ref_key: "toolVersionsFileInput",
								ref: es,
								type: "file",
								accept: ".tool-versions,text/plain",
								class: "hidden",
								onChange: a[4] ||= (e) => ts(e, "tool-versions")
							}, null, 544),
							P("div", Ir, [C(b(M), {
								size: "sm",
								variant: "outline",
								onClick: a[5] ||= (e) => $o.value?.click()
							}, {
								default: g(() => [...a[69] ||= [O("Choose mise.toml…", -1)]]),
								_: 1
							}), C(b(M), {
								size: "sm",
								variant: "outline",
								onClick: a[6] ||= (e) => es.value?.click()
							}, {
								default: g(() => [...a[70] ||= [O("Choose .tool-versions…", -1)]]),
								_: 1
							})]),
							Zo.value ? (h(), j("p", Lr, E(Zo.value), 1)) : D("", !0),
							Qo.value ? (h(), j("p", Rr, [
								a[71] ||= O(" Tools pinned: ", -1),
								P("span", zr, E(Qo.value.join(", ")), 1),
								a[72] ||= O(" — see the setup commands below. ", -1)
							])) : D("", !0)
						]),
						P("div", Br, [
							C(b(Q), {
								for: "dotfiles-repo",
								class: "mb-1 block"
							}, {
								default: g(() => [...a[74] ||= [O("Bootstrap dotfiles from a repo", -1)]]),
								_: 1
							}),
							a[77] ||= P("p", { class: "mb-2 text-xs text-muted-foreground" }, [
								O(" Experimental — clones the repo and hands off to "),
								P("span", { class: "font-mono" }, "mise bootstrap"),
								O(", which only applies dotfiles if that repo's own mise config declares them. ")
							], -1),
							P("div", Vr, [
								C(b(Z), {
									id: "dotfiles-repo",
									modelValue: ns.value,
									"onUpdate:modelValue": a[7] ||= (e) => ns.value = e,
									class: "w-72 font-mono",
									placeholder: "git@github.com:you/dotfiles.git"
								}, null, 8, ["modelValue"]),
								C(b(Z), {
									modelValue: rs.value,
									"onUpdate:modelValue": a[8] ||= (e) => rs.value = e,
									"aria-label": "Dotfiles branch or tag (optional)",
									class: "w-32 font-mono",
									placeholder: "branch (optional)"
								}, null, 8, ["modelValue"]),
								C(b(M), {
									size: "sm",
									variant: "outline",
									disabled: !ns.value.trim(),
									onClick: is
								}, {
									default: g(() => [...a[75] ||= [O("Add bootstrap", -1)]]),
									_: 1
								}, 8, ["disabled"]),
								X.has("mise:dotfiles-clone") ? (h(), T(b(M), {
									key: 0,
									size: "sm",
									variant: "outline",
									onClick: as
								}, {
									default: g(() => [...a[76] ||= [O("Remove", -1)]]),
									_: 1
								})) : D("", !0)
							])
						])
					])) : D("", !0)])
				])]), P("div", null, [a[96] ||= P("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Build", -1), P("div", Hr, [
					a[95] ||= P("h3", { class: "mb-4 text-base font-semibold" }, "Build container image", -1),
					Yt.value ? (h(), j("div", Ur, E(Yt.value), 1)) : D("", !0),
					Zt.value ? (h(), j("div", Wr, [P("span", null, [a[80] ||= O("Building variant of: ", -1), P("span", Gr, E(Zt.value), 1)]), P("button", {
						type: "button",
						class: "ml-auto cursor-pointer text-muted-foreground hover:text-foreground",
						onClick: Fo
					}, " ✕ Clear ")])) : D("", !0),
					P("div", Kr, [
						C(b(Q), { for: "builder-distro" }, {
							default: g(() => [...a[81] ||= [O("Distro", -1)]]),
							_: 1
						}),
						P("div", qr, [C(b(pn), {
							id: "builder-distro",
							modelValue: K.value,
							"onUpdate:modelValue": a[9] ||= (e) => K.value = e,
							class: "w-48"
						}, {
							default: g(() => [(h(), j(A, null, t(Lt, (e) => P("option", {
								key: e.value,
								value: e.value
							}, E(e.label), 9, Jr)), 64)), P("option", { value: Oo }, "Other… (custom)")]),
							_: 1
						}, 8, ["modelValue"]), Vt.value ? (h(), T(b(Z), {
							key: 0,
							id: "builder-custom-distro",
							"aria-label": "Custom distro",
							modelValue: Bt.value,
							"onUpdate:modelValue": a[10] ||= (e) => Bt.value = e,
							class: "w-40 font-mono",
							placeholder: "e.g. archlinux"
						}, null, 8, ["modelValue"])) : D("", !0)]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[82] ||= [O(" The curated list is verified against distrobuilder's own real image definitions — pick \"Other\" for anything else it supports; distrobuilder covers more than this list captures. ", -1)]]),
							_: 1
						}),
						C(b(Q), { for: "builder-release" }, {
							default: g(() => [...a[83] ||= [O("Release", -1)]]),
							_: 1
						}),
						P("div", Yr, [C(b(pn), {
							id: "builder-release",
							modelValue: q.value,
							"onUpdate:modelValue": a[11] ||= (e) => q.value = e,
							class: "w-48"
						}, {
							default: g(() => [(h(!0), j(A, null, t(Gt.value, (e) => (h(), j("option", {
								key: e.value,
								value: e.value
							}, E(e.label), 9, Xr))), 128)), P("option", { value: ko }, "Other… (custom)")]),
							_: 1
						}, 8, ["modelValue"]), Ht.value ? (h(), T(b(Z), {
							key: 0,
							id: "builder-custom-release",
							"aria-label": "Custom release",
							modelValue: J.value,
							"onUpdate:modelValue": a[12] ||= (e) => J.value = e,
							class: "w-40 font-mono",
							placeholder: "e.g. rolling"
						}, null, 8, ["modelValue"])) : D("", !0)]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[84] ||= [O("Options change with the distro above — a custom distro always shows the free-text field here too.", -1)]]),
							_: 1
						}),
						C(b(Q), { for: "builder-alias" }, {
							default: g(() => [...a[85] ||= [O("Alias", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "builder-alias",
							modelValue: qt.value,
							"onUpdate:modelValue": a[13] ||= (e) => qt.value = e,
							class: "w-96 justify-self-end",
							placeholder: "my-custom-image"
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[86] ||= [O(" Becomes the image's name in Incus once the build succeeds — other containers (and \"build variant\") reference it by this alias, so it must be unique. Not required to match the container's own name. ", -1)]]),
							_: 1
						})
					]),
					P("div", Zr, [
						a[92] ||= P("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Packages & tools", -1),
						C(b(Q), {
							for: "package-search",
							class: "sr-only"
						}, {
							default: g(() => [...a[87] ||= [O("Search packages and tools", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "package-search",
							modelValue: tn.value,
							"onUpdate:modelValue": a[14] ||= (e) => tn.value = e,
							class: "w-full font-mono",
							placeholder: "Search apt, npm, PyPI, Homebrew…"
						}, null, 8, ["modelValue"]),
						C(b($), null, {
							default: g(() => [...a[88] ||= [O(" apt only searches when Debian or Ubuntu is selected above. npm and PyPI results aren't OS packages — adding one adds a setup command that runs after packages install, and auto-adds the Node.js or Python packages it needs. Homebrew results show for browsing but can't be added yet — there's no way to bootstrap Homebrew itself inside an image build. ", -1)]]),
							_: 1
						}),
						on.value ? (h(), j("p", Qr, E(on.value), 1)) : D("", !0),
						rn.value.length > 0 ? (h(), j("p", $r, [a[89] ||= O(" Some sources are unavailable right now, showing results from the rest: ", -1), (h(!0), j(A, null, t(rn.value, (e, t) => (h(), j("span", { key: e.ecosystem }, [O(E(t > 0 ? ", " : " "), 1), P("strong", null, E(un[e.ecosystem]), 1)]))), 128))])) : D("", !0),
						an.value ? (h(), j("p", ei, "Searching…")) : nn.value.length > 0 ? (h(), j("div", ti, [(h(!0), j(A, null, t(nn.value, (e) => (h(), j("div", {
							key: `${e.ecosystem}:${e.name}`,
							class: "flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
						}, [
							P("span", { class: he(["shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase", e.ecosystem === "apt" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"]) }, E(un[e.ecosystem]), 3),
							P("div", ni, [
								P("span", ri, E(e.name), 1),
								e.version ? (h(), j("span", ii, E(e.version), 1)) : D("", !0),
								e.description ? (h(), j("p", ai, E(e.description), 1)) : D("", !0)
							]),
							e.ecosystem === "brew" ? (h(), j("span", oi, "not build-time yet")) : (h(), T(b(M), {
								key: 0,
								size: "sm",
								variant: "outline",
								disabled: No(e),
								onClick: (t) => Mo(e)
							}, {
								default: g(() => [O(E(No(e) ? "Added" : "+ Add"), 1)]),
								_: 2
							}, 1032, ["disabled", "onClick"]))
						]))), 128))])) : tn.value.trim().length >= 2 ? (h(), j("p", si, "No matches.")) : D("", !0),
						Y.size > 0 ? (h(), j("div", ci, [a[90] ||= P("p", { class: "mb-1.5 block text-xs font-medium" }, "Added from apt search", -1), P("div", li, [(h(!0), j(A, null, t(Y, (e) => (h(), j("span", {
							key: e,
							class: "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs"
						}, [O(E(e) + " ", 1), P("button", {
							type: "button",
							"aria-label": `Remove apt package ${e}`,
							class: "cursor-pointer text-muted-foreground hover:text-destructive",
							onClick: (t) => hn(e)
						}, "✕", 8, ui)]))), 128))])])) : D("", !0),
						X.size > 0 ? (h(), j("div", di, [a[91] ||= P("p", { class: "mb-1.5 block text-xs font-medium" }, "Extra setup commands (run after packages install)", -1), P("div", fi, [(h(!0), j(A, null, t(X, ([e, t]) => (h(), j("div", {
							key: e,
							class: "flex items-center gap-2 rounded-md border border-border px-2 py-1 font-mono text-xs"
						}, [P("span", pi, E(t), 1), P("button", {
							type: "button",
							"aria-label": `Remove setup command ${e}`,
							class: "cursor-pointer text-muted-foreground hover:text-destructive",
							onClick: (t) => jo(e)
						}, "✕", 8, mi)]))), 128))])])) : D("", !0)
					]),
					P("div", hi, [
						C(b(Q), {
							for: "builder-extra-packages",
							class: "mb-1.5 block text-xs text-muted-foreground"
						}, {
							default: g(() => [...a[93] ||= [O("Anything else? (one per line, or comma-separated)", -1)]]),
							_: 1
						}),
						o(P("textarea", {
							id: "builder-extra-packages",
							"onUpdate:modelValue": a[15] ||= (e) => Kt.value = e,
							rows: "2",
							class: "border-input bg-background w-full rounded-md border px-3 py-2 text-sm font-mono",
							placeholder: "e.g. htop"
						}, null, 512), [[_t, Kt.value]]),
						C(b($), null, {
							default: g(() => [...a[94] ||= [O(" Exact OS package names for the selected distro's package manager — merged with anything added from search above, duplicates removed. Use this for anything search didn't turn up. ", -1)]]),
							_: 1
						})
					]),
					P("div", gi, [C(b(M), {
						disabled: Jt.value,
						onClick: Os
					}, {
						default: g(() => [O(E(Jt.value ? "Starting…" : "Build"), 1)]),
						_: 1
					}, 8, ["disabled"])])
				])])]),
				a[100] ||= P("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Results", -1),
				P("div", _i, [
					a[99] ||= P("h3", { class: "mb-4 text-base font-semibold" }, "Builds", -1),
					C(b($), null, {
						default: g(() => [...a[97] ||= [O(" Live distrobuilder log output, streamed while a build runs. This list is client-side only and resets on page reload — successful builds still land in Saved images above, but the log history itself isn't persisted. ", -1)]]),
						_: 1
					}),
					Xt.value.length === 0 ? (h(), j("div", vi, [...a[98] ||= [P("span", { class: "h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-700" }, null, -1), P("span", { class: "font-mono text-[11px] text-neutral-500" }, [O(" Pick a distro and release above, then hit Build — progress and logs stream in here."), P("span", { class: "motion-safe:animate-pulse" }, "_")], -1)]])) : (h(), j("div", yi, [(h(!0), j(A, null, t(Xt.value, (e) => (h(), j("div", {
						key: e.buildId,
						class: "rounded-md border border-border p-3"
					}, [
						P("div", bi, [P("div", xi, [P("span", Si, E(e.alias), 1), P("span", Ci, E(e.distro) + " / " + E(e.release), 1)]), C(b(_e), { variant: ks(e.status?.status) }, {
							default: g(() => [O(E(e.status?.status ?? "queued"), 1)]),
							_: 2
						}, 1032, ["variant"])]),
						e.status?.error || e.error ? (h(), j("div", wi, E(e.status?.error || e.error), 1)) : D("", !0),
						P("div", Ti, [P("span", { class: he(["h-1.5 w-1.5 shrink-0 rounded-full", {
							"bg-emerald-500": e.status?.status === "success",
							"bg-red-500": e.status?.status === "failed",
							"bg-amber-500": e.status?.status === "running" || !e.status
						}]) }, null, 2), P("span", Ei, "distrobuilder · " + E(e.buildId.slice(0, 8)), 1)]),
						P("pre", Di, E(e.status?.logTail || "Waiting for log output…"), 1)
					]))), 128))]))
				])
			])) : r.value === "jails" ? (h(), j("section", Oi, [
				a[153] ||= P("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Dashboard", -1),
				P("div", ki, [
					P("div", Ai, [a[101] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Total Containers", -1), P("p", ji, E(_.value.length), 1)]),
					P("div", Mi, [a[102] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Running", -1), P("p", Ni, E(b(ae).length), 1)]),
					P("div", Pi, [a[103] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Stopped", -1), P("p", Fi, E(b(oe)), 1)]),
					P("div", Ii, [a[104] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Daemon", -1), P("div", Li, [C(b(_e), { variant: p.value ? "orange" : u.value ? "green" : "red" }, {
						default: g(() => [O(E(p.value ? "Degraded" : u.value ? "Reachable" : "Not running"), 1)]),
						_: 1
					}, 8, ["variant"])])]),
					P("div", Ri, [a[105] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Memory In Use", -1), P("p", zi, E(b(fe)(b(se))), 1)]),
					P("div", Bi, [
						a[106] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Total CPU (live)", -1),
						P("p", Vi, E(b(Se)()), 1),
						b(le).length >= 2 ? (h(), j("svg", Hi, [P("polyline", {
							points: b(Ce)(b(le), "cpuPct"),
							fill: "none",
							stroke: "currentColor",
							"stroke-width": "1.5"
						}, null, 8, Ui)])) : D("", !0),
						a[107] ||= P("p", { class: "mt-0.5 text-[10px] text-muted-foreground" }, "last ~2 min, sum of running containers", -1)
					])
				]),
				C(b($), { class: "mb-6" }, {
					default: g(() => [...a[108] ||= [O(" CPU shown here is a live rate (% of one core), computed from the change in cumulative CPU time between polls every 5 seconds — not the raw counter Incus reports, which only ever goes up. The sparkline is a rolling client-side window that resets on page reload; nothing is persisted server-side. ", -1)]]),
					_: 1
				}),
				P("div", Wi, [P("div", Gi, [
					a[114] ||= P("h3", { class: "mb-1 text-base font-semibold" }, "Network & ACL", -1),
					a[115] ||= P("p", { class: "mb-3 text-xs text-muted-foreground" }, " The policy currently configured for every container on this bridge (from saved config, not a live probe). ", -1),
					P("div", Ki, [
						P("div", null, [a[109] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Bridge", -1), P("p", qi, E(w.jailBridge || "—"), 1)]),
						P("div", null, [a[110] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Subnet", -1), P("p", Ji, E(w.jailSubnet || "—"), 1)]),
						P("div", null, [a[111] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "ACL Name", -1), P("p", Yi, E(w.aclName || "—"), 1)]),
						P("div", null, [a[112] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Blocked Ranges", -1), P("p", Xi, E(ft()) + " blocked", 1)]),
						P("div", null, [a[113] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Default Egress / Ingress", -1), P("p", Zi, E(w.aclDefaultEgress) + " / " + E(w.aclDefaultIngress), 1)])
					])
				]), P("div", Qi, [
					a[121] ||= P("h3", { class: "mb-1 text-base font-semibold" }, "Launch Container", -1),
					a[122] ||= P("p", { class: "mb-3 text-xs text-muted-foreground" }, " Applies the Container Defaults profile — no build step. Each container gets its own independent root filesystem and workspace even when launched from the same image. ", -1),
					P("div", $i, [
						P("div", ea, [C(b(Q), {
							for: "new-container-name",
							class: "mb-2 block"
						}, {
							default: g(() => [...a[116] ||= [O("Container name", -1)]]),
							_: 1
						}), C(b(Z), {
							id: "new-container-name",
							modelValue: y.value,
							"onUpdate:modelValue": a[16] ||= (e) => y.value = e,
							placeholder: "new-container-name",
							class: "w-full font-mono"
						}, null, 8, ["modelValue"])]),
						P("div", ta, [C(b(Q), {
							for: "launch-image",
							class: "mb-2 block"
						}, {
							default: g(() => [...a[117] ||= [O("Image", -1)]]),
							_: 1
						}), C(b(pn), {
							id: "launch-image",
							modelValue: re.value,
							"onUpdate:modelValue": a[17] ||= (e) => re.value = e,
							class: "w-full"
						}, {
							default: g(() => [P("option", na, "Default (" + E(w.jailImage || "—") + ")", 1), (h(!0), j(A, null, t(ms.value, (e) => (h(), j("option", {
								key: e.alias,
								value: e.alias
							}, E(e.alias) + E(e.isMaster ? " (golden master)" : "") + " — " + E(e.distro) + "/" + E(e.release), 9, ra))), 128))]),
							_: 1
						}, 8, ["modelValue"])]),
						C(b(M), {
							size: "sm",
							variant: "secondary",
							disabled: !!te.value,
							onClick: Ie
						}, {
							default: g(() => [...a[118] ||= [O("Launch", -1)]]),
							_: 1
						}, 8, ["disabled"])
					]),
					y.value && te.value ? (h(), j("p", ia, E(te.value), 1)) : D("", !0),
					P("div", aa, [C(b(cn), {
						id: "launch-allow-sudo",
						modelValue: S.value,
						"onUpdate:modelValue": a[18] ||= (e) => S.value = e
					}, null, 8, ["modelValue"]), a[119] ||= P("label", {
						for: "launch-allow-sudo",
						class: "cursor-pointer text-xs"
					}, " Allow sudo (NOPASSWD) for the agent user ", -1)]),
					C(b($), null, {
						default: g(() => [...a[120] ||= [O(" \"Default\" launches from Config → Container Defaults' image (the golden master, if one is set). Picking a specific image here launches from that image instead, just for this container — it doesn't change the default. Every launch, from any image, gets its own independent root filesystem; nothing is shared between containers built from the same source image. Sudo is off by default on purpose — the agent user having no path to root is what keeps a compromised dependency from escalating inside the container. Turning it on trades that away for convenience; you can also grant or check it later, per-container, from its Details panel. ", -1)]]),
						_: 1
					})
				])]),
				P("div", oa, [
					P("div", sa, [a[123] ||= P("h3", { class: "text-base font-semibold" }, "Containers", -1), b(oe) > 0 ? (h(), T(b(M), {
						key: 0,
						size: "sm",
						variant: "outline",
						disabled: L.value,
						onClick: Fe
					}, {
						default: g(() => [O(E(L.value ? "Deleting…" : `Delete ${b(oe)} stopped`), 1)]),
						_: 1
					}, 8, ["disabled"])) : D("", !0)]),
					C(b($), null, {
						default: g(() => [...a[124] ||= [O(" \"On bridge\" means this container's address falls inside the configured subnet — a real check, not a claim that the LAN-ban ACL is actively enforced for it specifically (that's a daemon-level policy on the whole bridge, shown above under Network & ACL). Each row's mini charts are the same rolling client-side window as the summary cards above. ", -1)]]),
						_: 1
					}),
					_.value.length === 0 ? (h(), j("p", ca, " No containers yet — launch one above to get started. ")) : (h(), j(A, { key: 1 }, [P("p", la, " Total: " + E(b(ae).length) + " container" + E(b(ae).length === 1 ? "" : "s") + " running, " + E(b(fe)(b(se))) + " memory, CPU time " + E(b(de)(Number(b(ce)))), 1), P("div", ua, [(h(!0), j(A, null, t(_.value, (e) => (h(), j("div", {
						key: e.name,
						class: he(["rounded-lg border border-border p-3", b(z) === e.name ? "border-primary/50" : "border-border"])
					}, [
						P("div", da, [P("div", fa, [
							P("span", pa, E(e.name), 1),
							Nt(e) ? (h(), j("span", ma, "on bridge")) : D("", !0),
							C(b(_e), { variant: ut(e.status) }, {
								default: g(() => [O(E(e.status), 1)]),
								_: 2
							}, 1032, ["variant"])
						]), P("span", ha, E(e.ipv4 || "—"), 1)]),
						P("div", ga, [P("div", null, [P("p", {
							class: "text-[10px] font-semibold tracking-[0.06em] uppercase text-muted-foreground",
							title: `Live rate, % ${b(be)()}`
						}, "CPU", 8, _a), P("div", va, [
							P("div", ya, [b(ye)(e) === null ? D("", !0) : (h(), j("div", {
								key: 0,
								class: "h-full rounded-full bg-primary",
								style: Ee({ width: b(ye)(e) + "%" })
							}, null, 4))]),
							P("span", ba, E(b(ve)(e)), 1),
							b(xe)(e.name).length >= 2 ? (h(), j("svg", xa, [P("polyline", {
								points: b(Ce)(b(xe)(e.name), "cpuPct"),
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "1.5"
							}, null, 8, Sa)])) : D("", !0)
						])]), P("div", null, [
							a[125] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.06em] uppercase text-muted-foreground" }, "Memory", -1),
							P("div", Ca, [P("span", wa, E(b(pe)(e)), 1), b(xe)(e.name).length >= 2 ? (h(), j("svg", Ta, [P("polyline", {
								points: b(Ce)(b(xe)(e.name), "memPct"),
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "1.5"
							}, null, 8, Ea)])) : D("", !0)]),
							b(me)(e) === null ? D("", !0) : (h(), j("div", Da, [P("div", {
								class: "h-full rounded-full bg-primary",
								style: Ee({ width: b(me)(e) + "%" })
							}, null, 4)]))
						])]),
						P("div", Oa, [
							C(b(M), {
								size: "sm",
								variant: "outline",
								onClick: (t) => Ne(e.name, "start")
							}, {
								default: g(() => [...a[126] ||= [O("Start", -1)]]),
								_: 1
							}, 8, ["onClick"]),
							C(b(M), {
								size: "sm",
								variant: "outline",
								onClick: (t) => Ne(e.name, "stop")
							}, {
								default: g(() => [...a[127] ||= [O("Stop", -1)]]),
								_: 1
							}, 8, ["onClick"]),
							C(b(M), {
								size: "sm",
								variant: "secondary",
								disabled: e.status.toLowerCase() !== "running",
								onClick: (t) => ie.value = e.name
							}, {
								default: g(() => [...a[128] ||= [O("Console", -1)]]),
								_: 1
							}, 8, ["disabled", "onClick"]),
							C(b(M), {
								size: "sm",
								variant: "outline",
								onClick: (t) => b(Ve)(e.name)
							}, {
								default: g(() => [O(E(b(z) === e.name ? "Hide manage" : "Manage"), 1)]),
								_: 2
							}, 1032, ["onClick"]),
							C(b(M), {
								size: "sm",
								variant: "destructive",
								onClick: (t) => Pe(e.name)
							}, {
								default: g(() => [...a[129] ||= [O("Delete", -1)]]),
								_: 1
							}, 8, ["onClick"])
						]),
						b(z) === e.name ? (h(), j("div", ka, [b(Le) ? (h(), j("p", Aa, "Loading…")) : b(B) ? (h(), j(A, { key: 1 }, [
							P("div", ja, [
								P("div", null, [a[130] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Image", -1), P("p", Ma, E(b(B).imageOs || "—") + " " + E(b(B).imageRelease || ""), 1)]),
								P("div", null, [a[131] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Profiles", -1), P("p", Na, E(b(B).profiles.join(", ")), 1)]),
								P("div", null, [a[132] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Storage pool", -1), P("p", Pa, E(b(B).storagePool || "—"), 1)]),
								P("div", null, [a[133] ||= P("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Bridge", -1), P("p", Fa, E(b(B).networkBridge || "—"), 1)])
							]),
							P("div", Ia, [P("div", La, [
								P("div", null, [C(b(Q), {
									for: "detail-cpu-limit",
									class: "mb-1 flex items-center gap-1.5 text-xs"
								}, {
									default: g(() => [a[135] ||= O(" CPU limit ", -1), b(B).cpuLimitIsOverride ? (h(), T(b(_e), {
										key: 0,
										variant: "orange"
									}, {
										default: g(() => [...a[134] ||= [O("override", -1)]]),
										_: 1
									})) : D("", !0)]),
									_: 1
								}), P("div", Ra, [C(b(Z), {
									id: "detail-cpu-limit",
									modelValue: b(Re),
									"onUpdate:modelValue": a[19] ||= (e) => l(Re) ? Re.value = e : null,
									class: "w-24 font-mono",
									placeholder: "e.g. 2"
								}, null, 8, ["modelValue"]), C(b(M), {
									size: "sm",
									variant: "outline",
									disabled: R.value,
									onClick: Ue
								}, {
									default: g(() => [...a[136] ||= [O("Apply", -1)]]),
									_: 1
								}, 8, ["disabled"])])]),
								P("div", null, [C(b(Q), {
									for: "detail-memory-limit",
									class: "mb-1 flex items-center gap-1.5 text-xs"
								}, {
									default: g(() => [a[138] ||= O(" Memory limit ", -1), b(B).memoryLimitIsOverride ? (h(), T(b(_e), {
										key: 0,
										variant: "orange"
									}, {
										default: g(() => [...a[137] ||= [O("override", -1)]]),
										_: 1
									})) : D("", !0)]),
									_: 1
								}), P("div", za, [C(b(Z), {
									id: "detail-memory-limit",
									modelValue: b(ze),
									"onUpdate:modelValue": a[20] ||= (e) => l(ze) ? ze.value = e : null,
									class: "w-24 font-mono",
									placeholder: "e.g. 4GiB"
								}, null, 8, ["modelValue"]), C(b(M), {
									size: "sm",
									variant: "outline",
									disabled: R.value,
									onClick: We
								}, {
									default: g(() => [...a[139] ||= [O("Apply", -1)]]),
									_: 1
								}, 8, ["disabled"])])]),
								b(B).cpuLimitIsOverride || b(B).memoryLimitIsOverride ? (h(), T(b(M), {
									key: 0,
									size: "sm",
									variant: "outline",
									disabled: R.value,
									onClick: Ge
								}, {
									default: g(() => [...a[140] ||= [O("Use profile default", -1)]]),
									_: 1
								}, 8, ["disabled"])) : D("", !0)
							]), P("div", null, [C(b(Q), {
								for: "detail-workspace",
								class: "mb-1 flex items-center gap-1.5 text-xs"
							}, {
								default: g(() => [a[142] ||= O(" Workspace host path (/workspace) ", -1), b(B).workspaceIsOverride ? (h(), T(b(_e), {
									key: 0,
									variant: "orange"
								}, {
									default: g(() => [...a[141] ||= [O("override", -1)]]),
									_: 1
								})) : D("", !0)]),
								_: 1
							}), P("div", Ba, [
								C(b(Z), {
									id: "detail-workspace",
									modelValue: b(Be),
									"onUpdate:modelValue": a[21] ||= (e) => l(Be) ? Be.value = e : null,
									class: "flex-1 font-mono"
								}, null, 8, ["modelValue"]),
								C(b(M), {
									size: "sm",
									variant: "outline",
									disabled: R.value,
									onClick: Ke
								}, {
									default: g(() => [...a[143] ||= [O("Apply", -1)]]),
									_: 1
								}, 8, ["disabled"]),
								b(B).workspaceIsOverride ? (h(), T(b(M), {
									key: 0,
									size: "sm",
									variant: "outline",
									disabled: R.value,
									onClick: qe
								}, {
									default: g(() => [...a[144] ||= [O("Use profile default", -1)]]),
									_: 1
								}, 8, ["disabled"])) : D("", !0)
							])])]),
							Je(b(B)) ? (h(), j("div", Va, [a[145] ||= P("span", null, [
								O(" This container shares "),
								P("span", { class: "font-mono" }, "/workspace"),
								O(" with every other container still on the profile's default — file writes are live-visible between them. ")
							], -1), C(b(M), {
								size: "sm",
								variant: "outline",
								disabled: H.value,
								onClick: Ye
							}, {
								default: g(() => [O(E(H.value ? "Isolating…" : "Isolate this container's workspace"), 1)]),
								_: 1
							}, 8, ["disabled"])])) : D("", !0),
							b(V) ? (h(), j("p", Ha, E(b(V)), 1)) : D("", !0),
							C(b($), null, {
								default: g(() => [...a[146] ||= [O(" Values without an \"override\" badge are inherited straight from the container's profile and apply to every container using it. Applying here overrides just this one instance — it won't touch the profile or any other container. Memory limit changes need a restart of this container to actually take effect on a running instance (verified: clearing an override alone doesn't shrink an already-larger live cgroup limit back down). Isolating a shared workspace points it at a new, empty per-container directory — it does not copy any files already sitting in the old shared one. ", -1)]]),
								_: 1
							}),
							P("div", Ua, [
								P("p", Wa, [a[147] ||= O(" Sudo (agent user) ", -1), C(b(_e), { variant: b(B).sudoEnabled ? "green" : "gray" }, {
									default: g(() => [O(E(b(B).sudoEnabled ? "enabled" : "disabled"), 1)]),
									_: 1
								}, 8, ["variant"])]),
								b(B).sudoEnabled ? D("", !0) : (h(), T(b(M), {
									key: 0,
									size: "sm",
									variant: "outline",
									disabled: rt.value,
									onClick: it
								}, {
									default: g(() => [O(E(rt.value ? "Granting…" : "Grant sudo (NOPASSWD)"), 1)]),
									_: 1
								}, 8, ["disabled"])),
								C(b($), null, {
									default: g(() => [...a[148] ||= [
										O(" Off by default on purpose — this is what keeps a compromised dependency from escalating to root inside the container. Granting sudo here applies immediately to the running container and can't be un-granted from this panel (remove ", -1),
										P("span", { class: "font-mono" }, "/etc/sudoers.d/agent", -1),
										O(" manually, or via the privileged command box below, if you need to revoke it). ", -1)
									]]),
									_: 1
								})
							]),
							P("div", Ga, [
								C(b(Q), {
									for: "homebrew-formula",
									class: "mb-1 block text-xs"
								}, {
									default: g(() => [...a[149] ||= [O("Install a package (Homebrew)", -1)]]),
									_: 1
								}),
								P("div", Ka, [C(b(Z), {
									id: "homebrew-formula",
									modelValue: Xe.value,
									"onUpdate:modelValue": a[22] ||= (e) => Xe.value = e,
									class: "w-48 font-mono",
									placeholder: "e.g. wget",
									onKeydown: Mt(At(nt, ["prevent"]), ["enter"])
								}, null, 8, ["modelValue", "onKeydown"]), C(b(M), {
									size: "sm",
									variant: "outline",
									disabled: !Xe.value.trim() || Ze.value,
									onClick: nt
								}, {
									default: g(() => [O(E(Ze.value ? "Installing…" : "Install"), 1)]),
									_: 1
								}, 8, ["disabled"])]),
								Qe.value ? (h(), j("p", qa, E(Qe.value), 1)) : D("", !0),
								$e.value ? (h(), j("p", Ja, E($e.value), 1)) : D("", !0),
								C(b($), null, {
									default: g(() => [...a[150] ||= [
										O(" Best-effort: bootstraps Homebrew itself under this container's non-root \"agent\" user if it isn't already present (needs bash and git inside the container), installing to ", -1),
										P("span", { class: "font-mono" }, "~/.linuxbrew", -1),
										O(" rather than Homebrew's usual shared system path — the official installer needs ", -1),
										P("span", { class: "font-mono" }, "sudo", -1),
										O(" for that path, and \"agent\" deliberately has none inside these containers. This runs against the LIVE container over exec — it isn't baked into the image, so a rebuilt or replacement container won't have it. ", -1)
									]]),
									_: 1
								})
							]),
							P("div", Ya, [
								C(b(Q), {
									for: "privileged-command",
									class: "mb-1 block text-xs"
								}, {
									default: g(() => [...a[151] ||= [O("Run a privileged command", -1)]]),
									_: 1
								}),
								P("div", Xa, [C(b(Z), {
									id: "privileged-command",
									modelValue: at.value,
									"onUpdate:modelValue": a[23] ||= (e) => at.value = e,
									class: "flex-1 font-mono",
									placeholder: "e.g. apt-get install -y htop",
									onKeydown: Mt(At(lt, ["prevent"]), ["enter"])
								}, null, 8, ["modelValue", "onKeydown"]), C(b(M), {
									size: "sm",
									variant: "outline",
									disabled: !at.value.trim() || ot.value,
									onClick: lt
								}, {
									default: g(() => [O(E(ot.value ? "Running…" : "Run"), 1)]),
									_: 1
								}, 8, ["disabled"])]),
								U.value ? (h(), j("div", Za, [P("p", { class: he(["text-xs", U.value.status === "success" ? "text-unraid-green-800" : "text-destructive"]) }, E(U.value.message), 3), U.value.stdout || U.value.stderr ? (h(), j("pre", Qa, E([U.value.stdout, U.value.stderr].filter(Boolean).join("\n")), 1)) : D("", !0)])) : D("", !0),
								C(b($), null, {
									default: g(() => [...a[152] ||= [O(" Runs as root, mediated by you here in the UI — the container's own \"agent\" user never gets this capability, so this stays safe even with sudo left off. Good for one-off fixes (a forgotten package) without needing the sudo toggle at all. ", -1)]]),
									_: 1
								})
							])
						], 64)) : D("", !0)])) : D("", !0)
					], 2))), 128))])], 64))
				])
			])) : r.value === "config" ? (h(), j("section", $a, [P("div", eo, [
				P("section", to, [
					a[168] ||= P("p", { class: "mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Runtime", -1),
					a[169] ||= P("h3", { class: "mb-4 text-base font-semibold" }, "Service", -1),
					P("div", no, [
						C(b(Q), { for: "config-enabled" }, {
							default: g(() => [...a[154] ||= [O("Enable Incus", -1)]]),
							_: 1
						}),
						C(b(cn), {
							id: "config-enabled",
							modelValue: w.enabled,
							"onUpdate:modelValue": a[24] ||= (e) => w.enabled = e
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[155] ||= [
								O(" Starts incusd on array start. Leaving this off keeps the daemon — and its private-prefixed binaries under ", -1),
								P("span", { class: "font-mono" }, "/usr/local/incus/", -1),
								O(" — installed but never running. ", -1)
							]]),
							_: 1
						}),
						C(b(Q), { for: "config-dashboard-widget" }, {
							default: g(() => [...a[156] ||= [O("Show Dashboard widget", -1)]]),
							_: 1
						}),
						C(b(cn), {
							id: "config-dashboard-widget",
							modelValue: w.dashboardWidgetEnable,
							"onUpdate:modelValue": a[25] ||= (e) => w.dashboardWidgetEnable = e
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[157] ||= [O(" Shows a jail-status box (running/stopped/other counts) on Unraid's Main/Dashboard tab. ", -1)]]),
							_: 1
						}),
						C(b(Q), { for: "config-state-dir" }, {
							default: g(() => [...a[158] ||= [O("Incus state directory", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-state-dir",
							modelValue: w.stateDir,
							"onUpdate:modelValue": a[26] ||= (e) => w.stateDir = e,
							class: "w-96 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[159] ||= [O(" Where incusd keeps its database, storage pool, and container state. Must be real persistent storage on the array, not tmpfs — this is the one thing that survives a reboot or plugin update. ", -1)]]),
							_: 1
						})
					]),
					P("div", ro, [a[167] ||= P("h4", { class: "mb-3 text-sm font-semibold" }, "Storage pool", -1), P("div", io, [
						C(b(Q), { for: "config-storage-driver" }, {
							default: g(() => [...a[160] ||= [O("Storage driver", -1)]]),
							_: 1
						}),
						C(b(pn), {
							id: "config-storage-driver",
							modelValue: w.storageDriver,
							"onUpdate:modelValue": a[27] ||= (e) => w.storageDriver = e,
							class: "w-56 justify-self-end"
						}, {
							default: g(() => [...a[161] ||= [P("option", { value: "dir" }, "dir (simple, no pool required)", -1), P("option", { value: "zfs" }, "zfs (snapshots/speed, needs existing pool)", -1)]]),
							_: 1
						}, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[162] ||= [
								P("span", { class: "font-mono" }, "dir", -1),
								O(" needs no existing pool and always works — it's the default for exactly that reason. ", -1),
								P("span", { class: "font-mono" }, "zfs", -1),
								O(" gets snapshots and speed, but the pool or dataset must already exist on your system; there's no safe way to auto-create one on your array. ", -1)
							]]),
							_: 1
						}),
						we.value ? (h(), j(A, { key: 0 }, [
							C(b(Q), { for: "config-storage-source" }, {
								default: g(() => [...a[163] ||= [O("ZFS pool/dataset", -1)]]),
								_: 1
							}),
							C(b(Z), {
								id: "config-storage-source",
								modelValue: w.storageSource,
								"onUpdate:modelValue": a[28] ||= (e) => w.storageSource = e,
								class: "w-96 justify-self-end font-mono"
							}, null, 8, ["modelValue"]),
							C(b($), { class: "col-span-2" }, {
								default: g(() => [...a[164] ||= [
									O(" An existing pool or dataset path, e.g. ", -1),
									P("span", { class: "font-mono" }, "nvme/incus", -1),
									O(". A dataset under this path is created if missing, but the pool itself must already exist. ", -1)
								]]),
								_: 1
							})
						], 64)) : D("", !0),
						C(b(Q), { for: "config-storage-pool" }, {
							default: g(() => [...a[165] ||= [O("Incus storage pool name", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-storage-pool",
							modelValue: w.storagePoolName,
							"onUpdate:modelValue": a[29] ||= (e) => w.storagePoolName = e,
							class: "w-48 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[166] ||= [O(" The name Incus itself uses for this storage pool internally — cosmetic, doesn't need to match anything else on the host. ", -1)]]),
							_: 1
						})
					])])
				]),
				P("section", ao, [
					a[195] ||= P("p", { class: "mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Network & Access", -1),
					a[196] ||= P("h3", { class: "mb-4 text-base font-semibold" }, "Network & ACL (LAN-ban)", -1),
					a[197] ||= P("p", { class: "mb-4 text-xs text-muted-foreground" }, " Controls the bridge/subnet containers attach to and the firewall rules governing what they can reach. ", -1),
					P("div", oo, [
						C(b(Q), { for: "config-bridge" }, {
							default: g(() => [...a[170] ||= [O("Container bridge", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-bridge",
							modelValue: w.jailBridge,
							"onUpdate:modelValue": a[30] ||= (e) => w.jailBridge = e,
							class: "w-48 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[171] ||= [O(" A dedicated NAT bridge name for containers, kept separate from Unraid's own br0 so container traffic never touches host networking directly. ", -1)]]),
							_: 1
						}),
						C(b(Q), { for: "config-subnet" }, {
							default: g(() => [...a[172] ||= [O("Container subnet", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-subnet",
							modelValue: w.jailSubnet,
							"onUpdate:modelValue": a[31] ||= (e) => w.jailSubnet = e,
							class: "w-48 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[173] ||= [O(" CIDR for the bridge. Defaults to an RFC 2544 benchmark range specifically because it won't collide with a typical home or office LAN. ", -1)]]),
							_: 1
						}),
						C(b(Q), { for: "config-nat" }, {
							default: g(() => [...a[174] ||= [O("NAT", -1)]]),
							_: 1
						}),
						C(b(cn), {
							id: "config-nat",
							modelValue: w.jailNat,
							"onUpdate:modelValue": a[32] ||= (e) => w.jailNat = e
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[175] ||= [O(" Routes container traffic to the Internet through the host. Turning this off isolates containers with no outbound access at all — no Internet, no LAN. ", -1)]]),
							_: 1
						}),
						C(b(Q), { for: "config-ipv6" }, {
							default: g(() => [...a[176] ||= [O("IPv6", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-ipv6",
							"model-value": "none",
							disabled: "",
							readonly: "",
							"aria-describedby": "config-ipv6-policy",
							class: "w-48 justify-self-end font-mono"
						}),
						C(b($), {
							id: "config-ipv6-policy",
							class: "col-span-2"
						}, {
							default: g(() => [...a[177] ||= [
								O(" Fixed to ", -1),
								P("span", { class: "font-mono" }, "none", -1),
								O(": IPv6 is deliberately fail-closed until the plugin can enforce isolation equivalent to the IPv4 ACL policy. Containers cannot enable it from this page. ", -1)
							]]),
							_: 1
						}),
						C(b(Q), { for: "config-acl-name" }, {
							default: g(() => [...a[178] ||= [O("ACL name", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-acl-name",
							modelValue: w.aclName,
							"onUpdate:modelValue": a[33] ||= (e) => w.aclName = e,
							class: "w-48 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[179] ||= [O(" The name of the Incus network ACL that enforces the LAN ban — created and applied to the bridge by the array-start init script. ", -1)]]),
							_: 1
						}),
						C(b(Q), { for: "config-egress" }, {
							default: g(() => [...a[180] ||= [O("Default egress action", -1)]]),
							_: 1
						}),
						C(b(pn), {
							id: "config-egress",
							modelValue: w.aclDefaultEgress,
							"onUpdate:modelValue": a[34] ||= (e) => w.aclDefaultEgress = e,
							class: "w-32 justify-self-end"
						}, {
							default: g(() => [...a[181] ||= [P("option", { value: "allow" }, "allow", -1), P("option", { value: "drop" }, "drop", -1)]]),
							_: 1
						}, 8, ["modelValue"]),
						C(b(Q), { for: "config-ingress" }, {
							default: g(() => [...a[182] ||= [O("Default ingress action", -1)]]),
							_: 1
						}),
						C(b(pn), {
							id: "config-ingress",
							modelValue: w.aclDefaultIngress,
							"onUpdate:modelValue": a[35] ||= (e) => w.aclDefaultIngress = e,
							class: "w-32 justify-self-end"
						}, {
							default: g(() => [...a[183] ||= [P("option", { value: "allow" }, "allow", -1), P("option", { value: "drop" }, "drop", -1)]]),
							_: 1
						}, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[184] ||= [O(" What happens to traffic not covered by a rule above. Egress defaults to allow (deny-list model — Internet stays reachable unless explicitly blocked); ingress defaults to drop (nothing reaches a container unsolicited). Tailscale's CGNAT range (100.64.0.0/10) is blocked by default; add only the narrow allow-hole a container genuinely needs rather than exposing the whole tailnet. ", -1)]]),
							_: 1
						})
					]),
					P("div", so, [
						C(b(Q), {
							for: "new-blocked-cidr",
							class: "mb-1.5 block"
						}, {
							default: g(() => [...a[185] ||= [O("Blocked CIDRs (deny-list)", -1)]]),
							_: 1
						}),
						bt.value.length > 0 ? (h(), j("div", co, [(h(!0), j(A, null, t(bt.value, (e) => (h(), j("span", {
							key: e,
							class: "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs"
						}, [O(E(e) + " ", 1), P("button", {
							type: "button",
							"aria-label": `Remove blocked CIDR ${e}`,
							class: "cursor-pointer text-muted-foreground hover:text-destructive",
							onClick: (t) => Et(e)
						}, "✕", 8, lo)]))), 128))])) : D("", !0),
						P("div", uo, [C(b(Z), {
							id: "new-blocked-cidr",
							modelValue: St.value,
							"onUpdate:modelValue": a[36] ||= (e) => St.value = e,
							class: "w-full font-mono",
							placeholder: "e.g. 10.0.0.0/8",
							onKeydown: Mt(At(Tt, ["prevent"]), ["enter"])
						}, null, 8, ["modelValue", "onKeydown"]), C(b(M), {
							size: "sm",
							variant: "outline",
							disabled: !St.value.trim(),
							onClick: Tt
						}, {
							default: g(() => [...a[186] ||= [O("Add", -1)]]),
							_: 1
						}, 8, ["disabled"])]),
						G.value ? (h(), j("p", fo, E(G.value), 1)) : D("", !0),
						C(b($), null, {
							default: g(() => [...a[187] ||= [O(" Ranges containers may not reach — this is the actual LAN ban. Add one CIDR at a time; defaults to the private IPv4 ranges (RFC 1918) plus link-local addresses. ", -1)]]),
							_: 1
						})
					]),
					P("div", po, [
						C(b(Q), {
							for: "new-allow-cidr",
							class: "mb-1.5 block"
						}, {
							default: g(() => [...a[188] ||= [O("Allow-holes (punched before block rules)", -1)]]),
							_: 1
						}),
						xt.value.length > 0 ? (h(), j("div", mo, [(h(!0), j(A, null, t(xt.value, (e) => (h(), j("span", {
							key: e,
							class: "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs"
						}, [O(E(e) + " ", 1), P("button", {
							type: "button",
							"aria-label": `Remove allowed CIDR ${e}`,
							class: "cursor-pointer text-muted-foreground hover:text-destructive",
							onClick: (t) => Ot(e)
						}, "✕", 8, ho)]))), 128))])) : D("", !0),
						P("div", go, [C(b(Z), {
							id: "new-allow-cidr",
							modelValue: Ct.value,
							"onUpdate:modelValue": a[37] ||= (e) => Ct.value = e,
							class: "w-full font-mono",
							placeholder: "e.g. 100.64.0.0/10",
							onKeydown: Mt(At(Dt, ["prevent"]), ["enter"])
						}, null, 8, ["modelValue", "onKeydown"]), C(b(M), {
							size: "sm",
							variant: "outline",
							disabled: !Ct.value.trim(),
							onClick: Dt
						}, {
							default: g(() => [...a[189] ||= [O("Add", -1)]]),
							_: 1
						}, 8, ["disabled"])]),
						wt.value ? (h(), j("p", _o, E(wt.value), 1)) : D("", !0),
						C(b($), null, {
							default: g(() => [...a[190] ||= [O(" Exceptions punched through the block list before it's evaluated — e.g. one specific internal service (a local LLM, a search index) a container legitimately needs to reach. ", -1)]]),
							_: 1
						})
					]),
					P("div", vo, [
						a[193] ||= P("h4", { class: "mb-3 text-sm font-semibold" }, "Tailscale", -1),
						a[194] ||= P("p", { class: "mb-4 text-xs text-muted-foreground" }, " Optional — when set, new containers automatically join your tailnet using this key. ", -1),
						P("div", yo, [
							C(b(Q), { for: "tailscale-auth-key" }, {
								default: g(() => [...a[191] ||= [O("Tailscale auth key", -1)]]),
								_: 1
							}),
							P("div", bo, [
								C(b(Z), {
									id: "tailscale-auth-key",
									modelValue: Oe.value,
									"onUpdate:modelValue": a[38] ||= (e) => Oe.value = e,
									type: Te.value ? "text" : "password",
									class: "w-72 font-mono",
									placeholder: w.tsAuthKeyConfigured ? "Configured — enter a replacement" : "tskey-auth-…"
								}, null, 8, [
									"modelValue",
									"type",
									"placeholder"
								]),
								C(b(M), {
									size: "sm",
									variant: "outline",
									onClick: a[39] ||= (e) => Te.value = !Te.value
								}, {
									default: g(() => [O(E(Te.value ? "Hide" : "Show"), 1)]),
									_: 1
								}),
								w.tsAuthKeyConfigured ? (h(), T(b(M), {
									key: 0,
									size: "sm",
									variant: "outline",
									onClick: a[40] ||= (e) => ke.value = !ke.value
								}, {
									default: g(() => [O(E(ke.value ? "Keep key" : "Clear on save"), 1)]),
									_: 1
								})) : D("", !0)
							]),
							C(b($), { class: "col-span-2" }, {
								default: g(() => [...a[192] ||= [O(" The stored key is write-only and is never returned to this page. A reusable or ephemeral key from your Tailscale admin console. Best-effort: if a container's image doesn't have Tailscale installed, joining is silently skipped rather than failing the launch — it never blocks a container from starting. ", -1)]]),
								_: 1
							})
						])
					])
				]),
				P("section", xo, [
					a[216] ||= P("p", { class: "mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Container Defaults", -1),
					a[217] ||= P("h3", { class: "mb-4 text-base font-semibold" }, "Defaults", -1),
					P("div", So, [
						C(b(Q), { for: "config-profile" }, {
							default: g(() => [...a[198] ||= [O("Container profile", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-profile",
							modelValue: w.jailProfile,
							"onUpdate:modelValue": a[41] ||= (e) => w.jailProfile = e,
							class: "w-48 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[199] ||= [O(" The Incus profile new containers launch with — sets resource limits, network, and mounts, defined in the array-start init script's profile template. ", -1)]]),
							_: 1
						}),
						C(b(Q), { for: "config-image" }, {
							default: g(() => [...a[200] ||= [O("Default image", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-image",
							modelValue: w.jailImage,
							"onUpdate:modelValue": a[42] ||= (e) => w.jailImage = e,
							class: "w-96 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[201] ||= [
								O(" Used when launching a container without picking a specific image — either a remote reference like ", -1),
								P("span", { class: "font-mono" }, "images:debian/trixie/cloud", -1),
								O(", or a locally-built image's alias. Marking an image as the golden master in the Builder tab sets this automatically. ", -1)
							]]),
							_: 1
						}),
						C(b(Q), { for: "config-nesting" }, {
							default: g(() => [...a[202] ||= [O("Allow nesting", -1)]]),
							_: 1
						}),
						C(b(cn), {
							id: "config-nesting",
							modelValue: w.jailNesting,
							"onUpdate:modelValue": a[43] ||= (e) => w.jailNesting = e
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[203] ||= [O(" Lets a container run Docker or Incus inside itself — needed for agents that spin up their own sandboxes, but widens what a compromised container could reach. ", -1)]]),
							_: 1
						}),
						C(b(Q), { for: "config-cpu" }, {
							default: g(() => [...a[204] ||= [O("CPU limit", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-cpu",
							modelValue: w.jailCpu,
							"onUpdate:modelValue": a[44] ||= (e) => w.jailCpu = e,
							class: "w-24 justify-self-end font-mono",
							placeholder: "empty = no cap"
						}, null, 8, ["modelValue"]),
						x.value ? (h(), j("p", Co, E(x.value), 1)) : D("", !0),
						C(b(Q), { for: "config-memory" }, {
							default: g(() => [...a[205] ||= [O("Memory limit", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-memory",
							modelValue: w.jailMemory,
							"onUpdate:modelValue": a[45] ||= (e) => w.jailMemory = e,
							class: "w-24 justify-self-end font-mono",
							placeholder: "empty = no cap"
						}, null, 8, ["modelValue"]),
						ne.value ? (h(), j("p", wo, E(ne.value), 1)) : D("", !0),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[206] ||= [
								O(" Hard resource ceiling applied via the container profile at launch — CPU as a core count (e.g. ", -1),
								P("span", { class: "font-mono" }, "2", -1),
								O("), memory with a unit (e.g. ", -1),
								P("span", { class: "font-mono" }, "4GiB", -1),
								O("). Leave either empty for no cap. ", -1)
							]]),
							_: 1
						}),
						C(b(Q), { for: "config-workspace" }, {
							default: g(() => [...a[207] ||= [O("Workspace root", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-workspace",
							modelValue: w.jailWorkspaceRoot,
							"onUpdate:modelValue": a[46] ||= (e) => w.jailWorkspaceRoot = e,
							class: "w-96 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[208] ||= [
								O(" Host directory holding per-container workspaces, bind-mounted in with idmap shifting. Must be real persistent storage — the init script refuses to start if it's tmpfs, since that would silently lose \"persistent\" data on every reboot. Prefer a real device mount (e.g. ", -1),
								P("span", { class: "font-mono" }, "/mnt/cache/appdata/...", -1),
								O(") over a ", -1),
								P("span", { class: "font-mono" }, "/mnt/user/...", -1),
								O(" path — Unraid's shfs FUSE union view generally doesn't support the idmapped-mount feature the shift needs. ", -1)
							]]),
							_: 1
						}),
						C(b(Q), { for: "config-agent-uid" }, {
							default: g(() => [...a[209] ||= [O("Agent UID", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-agent-uid",
							modelValue: w.jailAgentUid,
							"onUpdate:modelValue": a[47] ||= (e) => w.jailAgentUid = e,
							class: "w-24 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						C(b(Q), { for: "config-agent-gid" }, {
							default: g(() => [...a[210] ||= [O("Agent GID", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-agent-gid",
							modelValue: w.jailAgentGid,
							"onUpdate:modelValue": a[48] ||= (e) => w.jailAgentGid = e,
							class: "w-24 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						C(b($), { class: "col-span-2" }, {
							default: g(() => [...a[211] ||= [O(" The uid/gid inside each container mapped to your host user — match your own host user if you want files under the bind-mounted workspace to show correct ownership from outside the container. ", -1)]]),
							_: 1
						})
					]),
					P("div", To, [
						a[214] ||= P("h4", { class: "mb-3 text-sm font-semibold" }, "Bind mounts", -1),
						C(b(Q), {
							for: "config-bind-mounts",
							class: "mb-2 block"
						}, {
							default: g(() => [...a[212] ||= [O("Host config bind-mounts", -1)]]),
							_: 1
						}),
						C(b(Z), {
							id: "config-bind-mounts",
							modelValue: w.jailBindMounts,
							"onUpdate:modelValue": a[49] ||= (e) => w.jailBindMounts = e,
							class: "w-full font-mono",
							placeholder: "/boot/config/plugins/incus/bind-mounts/claude:/home/agent/.claude:ro"
						}, null, 8, ["modelValue"]),
						a[215] ||= P("p", { class: "mt-2 text-xs text-muted-foreground" }, " Comma-separated host:container[:ro|rw] triples from approved roots. Mounts default to read-only; only sources beneath the workspace root may be writable. ", -1),
						C(b($), null, {
							default: g(() => [...a[213] ||= [
								O(" Copy curated agent config under ", -1),
								P("span", { class: "font-mono" }, "/boot/config/plugins/incus/bind-mounts", -1),
								O(" rather than exposing host home or system paths. Sources must resolve beneath that directory or the configured workspace root; config-root mounts are always read-only. ", -1)
							]]),
							_: 1
						})
					])
				])
			]), P("div", Eo, [C(b(M), {
				disabled: s.value || !!x.value || !!ne.value,
				onClick: Me
			}, {
				default: g(() => [O(E(s.value ? "Applying…" : "Apply"), 1)]),
				_: 1
			}, 8, ["disabled"])])])) : D("", !0)
		], 64)), ie.value ? (h(), T(b(n), {
			key: 2,
			"jail-name": ie.value,
			onClose: a[50] ||= (e) => ie.value = null
		}, null, 8, ["jail-name"])) : D("", !0)]));
	}
}), { shadowRoot: !1 });
customElements.get("incus-settings-app") || customElements.define("incus-settings-app", jo);
