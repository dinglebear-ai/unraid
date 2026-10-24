import { $ as e, A as t, B as n, C as r, D as i, E as a, F as o, G as s, H as c, I as l, J as u, K as d, L as f, M as p, N as m, O as h, P as g, Q as _, R as v, S as ee, T as te, U as y, V as ne, W as b, X as re, Y as ie, Z as x, _ as S, a as ae, at as oe, b as se, c as ce, ct as le, d as C, dt as w, et as ue, f as T, ft as de, g as E, h as fe, i as pe, it as me, j as he, k as ge, l as D, lt as _e, m as ve, n as ye, nt as be, o as O, ot as xe, p as k, pt as Se, q as Ce, r as A, rt as we, s as Te, st as Ee, t as j, tt as De, u as M, ut as Oe, v as ke, w as N, x as Ae, y as P, z as F } from "./incus-settings-graphql-client-LuoElzcT.js";
// node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js
var je = void 0, Me = typeof window < "u" && window.trustedTypes;
if (Me) try {
	je = /* @__PURE__ */ Me.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var Ne = je ? (e) => je.createHTML(e) : (e) => e, Pe = "http://www.w3.org/2000/svg", Fe = "http://www.w3.org/1998/Math/MathML", I = typeof document < "u" ? document : null, L = I && /* @__PURE__ */ I.createElement("template"), R = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? I.createElementNS(Pe, e) : t === "mathml" ? I.createElementNS(Fe, e) : n ? I.createElement(e, { is: n }) : I.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => I.createTextNode(e),
	createComment: (e) => I.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => I.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), i !== a && (i = i.nextSibling););
		else {
			L.innerHTML = Ne(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = L.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, z = /* @__PURE__ */ Symbol("_vtc");
function Ie(e, t, n) {
	let r = e[z];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var B = /* @__PURE__ */ Symbol("_vod"), Le = /* @__PURE__ */ Symbol("_vsh"), Re = /* @__PURE__ */ Symbol(""), ze = /(?:^|;)\s*display\s*:/;
function Be(e, t, n) {
	let r = e.style, i = me(n), a = !1;
	if (n && !i) {
		if (t) {
			if (me(t)) for (let e of t.split(";")) {
				let t = e.slice(0, e.indexOf(":")).trim();
				n[t] ?? Ve(r, t, "");
			}
			else for (let e in t) n[e] ?? Ve(r, e, "");
		}
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? Ve(r, i, "") : Ge(e, i, !me(t) && t ? t[i] : void 0, o) || Ve(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[Re];
			e && (n += ";" + e), r.cssText = n, a = ze.test(n);
		}
	} else t && e.removeAttribute("style");
	B in e && (i && t === n || (e[B] = a ? r.display : ""), e[Le] && (r.display = "none"));
}
var V = /\s*!important$/;
function Ve(e, t, n) {
	if (x(n)) n.forEach((n) => Ve(e, t, n));
	else if (n ??= "", t.startsWith("--")) V.test(n) ? e.setProperty(t, n.replace(V, ""), "important") : e.setProperty(t, n);
	else {
		let r = We(e, t);
		V.test(n) ? e.setProperty(u(r), n.replace(V, ""), "important") : e[r] = n;
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
	let r = b(t);
	if (r !== "filter" && r in e) return Ue[t] = r;
	r = s(r);
	for (let n = 0; n < He.length; n++) {
		let i = He[n] + r;
		if (i in e) return Ue[t] = i;
	}
	return t;
}
function Ge(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && me(r) && n === r;
}
var Ke = "http://www.w3.org/1999/xlink";
function qe(e, t, n, r, i, a = we(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Ke, t.slice(6, t.length)) : e.setAttributeNS(Ke, t, n) : n == null || a && !ie(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : oe(n) ? String(n) : n);
}
function Je(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? Ne(n) : n);
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
		r === "boolean" ? n = ie(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
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
		if (x(r)) {
			let n = e.stopImmediatePropagation;
			e.stopImmediatePropagation = () => {
				n.call(e), e._stopped = !0;
			};
			let i = r.slice(), a = [e];
			for (let n = 0; n < i.length && !e._stopped; n++) {
				let e = i[n];
				e && Te(e, t, 5, a);
			}
		} else Te(r, t, 5, [e]);
	};
	return n.value = e, n.attached = rt(), n;
}
var U = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, at = (t, n, r, i, a, o) => {
	let s = a === "svg";
	n === "class" ? Ie(t, i, s) : n === "style" ? Be(t, r, i) : ue(n) ? e(n) || Ze(t, n, r, i, o) : (n[0] === "." ? (n = n.slice(1), 1) : n[0] === "^" ? (n = n.slice(1), 0) : ot(t, n, i, s)) ? (Je(t, n, i), t.tagName.includes("-") || n !== "value" && n !== "checked" && n !== "selected" || qe(t, n, i, s, o, n !== "value")) : t._isVueCE && (st(t, n) || t._def.__asyncLoader && (/[A-Z]/.test(n) || !me(i))) ? Je(t, b(n), i, o, n) : (n === "true-value" ? t._trueValue = i : n === "false-value" && (t._falseValue = i), qe(t, n, i, s));
};
function ot(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && U(t) && _(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return U(t) && me(n) ? !1 : t in e;
}
function st(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = b(t);
	return Array.isArray(n) ? n.some((e) => b(e) === r) : Object.keys(n).some((e) => b(e) === r);
}
var ct = {};
// @__NO_SIDE_EFFECTS__
function lt(e, t, n) {
	let r = P(e, t);
	De(r) && (r = d({}, r, t));
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
		this._connected = !1, N(() => {
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
			if (n && !x(n)) for (let e in n) {
				let t = n[e];
				(t === Number || t && t.type === Number) && (e in this._props && (this._props[e] = Se(this._props[e])), (i ||= /* @__PURE__ */ Object.create(null))[b(e)] = !0);
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
		if (t) for (let e in t) Ce(this, e) || Object.defineProperty(this, e, { get: () => y(t[e]) });
	}
	_resolveProps(e) {
		let { props: t } = e, n = x(t) ? t : Object.keys(t || {});
		for (let e of Object.keys(this)) e[0] !== "_" && n.includes(e) && this._setProp(e, this[e]);
		for (let e of n.map(b)) Object.defineProperty(this, e, {
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : ct, r = b(e);
		t && this._numberProps && this._numberProps[r] && (n = Se(n)), this._setProp(r, n, !1, !0);
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
		this._app && (e.appContext = this._app._context), G(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = S(this._def, d(e, this._props));
		return this._instance || (t.ce = (e) => {
			this._instance = e, e.ce = this, e.isCE = !0;
			let t = (e, t) => {
				this.dispatchEvent(new CustomEvent(e, De(t[0]) ? d({ detail: t }, t[0]) : { detail: t }));
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
	return x(t) ? (e) => re(t, e) : t;
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
	return t && (e = e.trim()), n && (e = le(e)), e;
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
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? le(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, vt = {
	deep: !0,
	created(e, t, n) {
		e[W] = ft(n), H(e, "change", () => {
			let t = e._modelValue, n = wt(e), r = e.checked, i = e[W];
			if (x(t)) {
				let e = Ee(t, n), a = e !== -1;
				if (r && !a) i(t.concat(n));
				else if (!r && a) {
					let n = [...t];
					n.splice(e, 1), i(n);
				}
			} else if (be(t)) {
				let e = new Set(t);
				r ? e.add(n) : e.delete(n), i(e);
			} else i(Tt(e, r));
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
	if (x(t)) i = Ee(t, r.props.value) > -1;
	else if (be(t)) i = t.has(r.props.value);
	else {
		if (t === n) return;
		i = xe(t, Tt(e, !0));
	}
	e.checked !== i && (e.checked = i);
}
var bt = {
	created(e, { value: t }, n) {
		e.checked = xe(t, n.props.value), e[W] = ft(n), H(e, "change", () => {
			e[W](wt(e));
		});
	},
	beforeUpdate(e, { value: t, oldValue: n }, r) {
		e[W] = ft(r), t !== n && (e.checked = xe(t, r.props.value));
	}
}, xt = {
	deep: !0,
	created(e, { value: t, modifiers: { number: n } }, r) {
		e._modelValue = t, H(e, "change", () => {
			let t = Array.prototype.filter.call(e.options, (e) => e.selected).map((e) => n ? le(wt(e)) : wt(e)), r = e.multiple, i = r ? be(e._modelValue) ? new Set(t) : t : t[0], a = e._pendingValue = [r, r ? x(i) ? t.slice() : t : i];
			try {
				e[W](i);
			} finally {
				N(() => {
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
	if (!n || x(e)) return xe(e, t);
	if (be(e)) {
		if (e.size !== t.length) return !1;
		for (let n of t) if (!e.has(n)) return !1;
		return !0;
	}
	return !1;
}
function Ct(e, t) {
	let n = e.multiple, r = x(t);
	if (!n || r || be(t)) {
		for (let i = 0, a = e.options.length; i < a; i++) {
			let a = e.options[i], o = wt(a);
			if (n) {
				if (r) {
					let e = typeof o;
					a.selected = e === "string" || e === "number" ? t.some((e) => String(e) === String(o)) : Ee(t, o) > -1;
				} else a.selected = t.has(o);
			} else if (xe(wt(a), t)) {
				e.selectedIndex !== i && (e.selectedIndex = i);
				return;
			}
		}
		!n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
	}
}
function wt(e) {
	return "_value" in e ? e._value : e.value;
}
function Tt(e, t) {
	let n = t ? "_trueValue" : "_falseValue";
	return n in e ? e[n] : t;
}
var Et = {
	created(e, t, n) {
		Ot(e, t, n, null, "created");
	},
	mounted(e, t, n) {
		Ot(e, t, n, null, "mounted");
	},
	beforeUpdate(e, t, n, r) {
		Ot(e, t, n, r, "beforeUpdate");
	},
	updated(e, t, n, r) {
		Ot(e, t, n, r, "updated");
	}
};
function Dt(e, t) {
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
function Ot(e, t, n, r, i) {
	let a = Dt(e.tagName, n.props && n.props.type)[i];
	a && a(e, t, n, r);
}
var kt = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], At = {
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
	exact: (e, t) => kt.some((n) => e[`${n}Key`] && !t.includes(n))
}, jt = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = At[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, Mt = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, Nt = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = u(n.key);
		if (t.some((e) => e === r || Mt[e] === r)) return e(n);
	}));
}, Pt = /* @__PURE__ */ d({ patchProp: at }, R), Ft;
function It() {
	return Ft ||= ve(Pt);
}
var G = ((...e) => {
	It().render(...e);
}), Lt = ((...e) => {
	let t = It().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = q(e);
		if (!r) return;
		let i = t._component;
		_(i) || i.render || i.template || (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, K(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function K(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function q(e) {
	return me(e) ? document.querySelector(e) : e;
}
// node_modules/reka-ui/dist/shared/createContext.js
function Rt(e, t) {
	let n = typeof e == "string" && !t ? `${e}Context` : t, r = Symbol(n);
	return [(t) => {
		let n = ee(r, t);
		if (n || n === null) return n;
		throw Error(`Injection \`${r.toString()}\` not found. Component must be used within ${Array.isArray(e) ? `one of the following components: ${e.join(", ")}` : `\`${e}\``}`);
	}, (e) => (ge(r, e), e)];
}
// node_modules/reka-ui/node_modules/@vueuse/shared/dist/index.js
var J = typeof window < "u" && typeof document < "u";
typeof WorkerGlobalScope < "u" && globalThis instanceof WorkerGlobalScope;
var zt = (e) => e !== void 0;
J && window.document, J && window.navigator, J && window.location;
function Bt(e) {
	let t = ne(e);
	return t?.$el ?? t;
}
function Vt(e) {
	return JSON.parse(JSON.stringify(e));
}
function Ht(e, t, n, r = {}) {
	var i, a;
	let { clone: o = !1, passive: s = !1, eventName: c, deep: l = !1, defaultValue: u, shouldEmit: d } = r, f = se(), p = n || f?.emit || (f == null || (i = f.$emit) == null ? void 0 : i.bind(f)) || (f == null || (a = f.proxy) == null || (a = a.$emit) == null ? void 0 : a.bind(f?.proxy)), h = c;
	t ||= "modelValue", h ||= `update:${t.toString()}`;
	let g = (e) => o ? typeof o == "function" ? o(e) : Vt(e) : e, _ = () => zt(e[t]) ? g(e[t]) : u, ee = (e) => {
		d ? d(e) && p(h, e) : p(h, e);
	};
	if (s) {
		let n = v(_()), r = !1;
		return m(() => e[t], (e) => {
			r || (r = !0, n.value = g(e), N(() => r = !1));
		}), m(n, (n) => {
			!r && (n !== e[t] || l) && ee(n);
		}, { deep: l }), n;
	}
	return D({
		get() {
			return _();
		},
		set(e) {
			ee(e);
		}
	});
}
// node_modules/reka-ui/dist/shared/renderSlotFragments.js
function Ut(e) {
	return e ? e.flatMap((e) => e.type === O ? Ut(e.children) : [e]) : [];
}
// node_modules/reka-ui/dist/shared/useEmitAsProps.js
function Wt(e) {
	let t = se(), n = t?.type.emits, r = {};
	return n?.length || console.warn(`No emitted event found. Please check component: ${t?.type.__name}`), n?.forEach((t) => {
		r[de(b(t))] = (...n) => e(t, ...n);
	}), r;
}
// node_modules/reka-ui/dist/shared/useFormControl.js
function Gt(e) {
	return D(() => !ne(e) || !!Bt(e)?.closest("form"));
}
// node_modules/reka-ui/dist/shared/useForwardExpose.js
function Kt() {
	let e = se(), t = v(), n = D(() => r());
	i(() => {
		n.value !== r() && c(t);
	});
	function r() {
		return t.value && "$el" in t.value && ["#text", "#comment"].includes(t.value.$el.nodeName) ? t.value.$el.nextElementSibling : Bt(t);
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
	let t = se(), n = Object.keys(t?.type.props ?? {}).reduce((e, n) => {
		let r = (t?.type.props[n]).default;
		return r !== void 0 && (e[n] = r), e;
	}, {}), r = F(e);
	return D(() => {
		let e = {}, i = t?.vnode.props ?? {};
		return Object.keys(i).forEach((t) => {
			e[b(t)] = i[t];
		}), Object.keys({
			...n,
			...e
		}).reduce((e, t) => (r.value[t] !== void 0 && (e[t] = r.value[t]), e), {});
	});
}
// node_modules/reka-ui/dist/shared/useForwardPropsEmits.js
function Jt(e, t) {
	let n = qt(e), r = t ? Wt(t) : {};
	return D(() => ({
		...n.value,
		...r
	}));
}
// node_modules/reka-ui/dist/shared/useForwardScopeId.js
function Yt() {
	let e = se()?.vnode?.scopeId;
	return e ? { [e]: "" } : {};
}
// node_modules/reka-ui/dist/Primitive/Slot.js
var Xt = /*#__PURE__*/ P({
	name: "PrimitiveSlot",
	inheritAttrs: !1,
	setup(e, { attrs: t, slots: n }) {
		return () => {
			if (!n.default) return null;
			let e = Ut(n.default()), i = e.findIndex((e) => e.type !== ae);
			if (i === -1) return e;
			let a = e[i];
			delete a.props?.ref;
			let o = a.props ? r(t, a.props) : t, s = ce({
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
], Qt = /*#__PURE__*/ P({
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
		return typeof r == "string" && Zt.includes(r) ? () => Ae(r, t) : r === "template" ? () => Ae(Xt, t, { default: n.default }) : () => Ae(e.as, t, { default: n.default });
	}
});
// node_modules/reka-ui/dist/Primitive/usePrimitiveElement.js
function $t() {
	let e = v();
	return {
		primitiveElement: e,
		currentElement: D(() => ["#text", "#comment"].includes(e.value?.$el.nodeName) ? e.value?.$el.nextElementSibling : Bt(e))
	};
}
// node_modules/reka-ui/dist/VisuallyHidden/VisuallyHidden.js
var en = /* @__PURE__ */ P({
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
		return (t, n) => (h(), C(y(Qt), {
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
			default: g(() => [he(t.$slots, "default")]),
			_: 3
		}, 8, [
			"as",
			"as-child",
			"aria-hidden",
			"data-hidden",
			"tabindex"
		]));
	}
}), tn = /* @__PURE__ */ P({
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
		let t = e, { primitiveElement: n, currentElement: i } = $t(), a = D(() => t.checked ?? t.value);
		return m(a, (e, t) => {
			if (!i.value) return;
			let n = i.value, r = window.HTMLInputElement.prototype, a = Object.getOwnPropertyDescriptor(r, "value").set;
			if (a && e !== t) {
				let t = new Event("input", { bubbles: !0 }), r = new Event("change", { bubbles: !0 });
				a.call(n, e), n.dispatchEvent(t), n.dispatchEvent(r);
			}
		}), (e, i) => (h(), C(en, r({
			ref_key: "primitiveElement",
			ref: n
		}, {
			...t,
			...e.$attrs
		}, { as: "input" }), null, 16));
	}
}), nn = /* @__PURE__ */ P({
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
		let n = e, i = D(() => typeof n.value == "object" && Array.isArray(n.value) && n.value.length === 0 && n.required), a = D(() => typeof n.value == "string" || typeof n.value == "number" || typeof n.value == "boolean" || n.value === null || n.value === void 0 ? [{
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
		return (o, s) => (h(), k(O, null, [T(" We render single input if it's required "), i.value ? (h(), C(tn, r({ key: e.name }, {
			...n,
			...o.$attrs
		}, {
			name: e.name,
			value: e.value
		}), null, 16, ["name", "value"])) : (h(!0), k(O, { key: 1 }, t(a.value, (e) => (h(), C(tn, r({ key: e.name }, { ref_for: !0 }, {
			...n,
			...o.$attrs
		}, {
			name: e.name,
			value: e.value
		}), null, 16, ["name", "value"]))), 128))], 2112));
	}
}), [rn, an] = /*#__PURE__*/ Rt("SwitchRoot"), on = /* @__PURE__ */ P({
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
		}), c = D(() => s.value === i.trueValue);
		function l() {
			o.value || (s.value = c.value ? i.falseValue : i.trueValue);
		}
		let { forwardRef: u, currentElement: d } = Kt(), f = Gt(d), p = Yt(), m = D(() => i.id && d.value ? document.querySelector(`[for="${i.id}"]`)?.innerText : void 0);
		return an({
			checked: c,
			toggleCheck: l,
			disabled: o
		}), (t, n) => (h(), k(O, null, [S(y(Qt), r({
			id: e.id,
			ref: y(u),
			role: "switch",
			type: e.as === "button" ? "button" : void 0,
			value: e.value,
			"aria-label": t.$attrs["aria-label"] || m.value,
			"aria-checked": c.value,
			"aria-required": e.required,
			"data-state": c.value ? "checked" : "unchecked",
			"data-disabled": y(o) ? "" : void 0,
			"as-child": e.asChild,
			as: e.as,
			disabled: y(o)
		}, {
			...y(p),
			...t.$attrs
		}, {
			onClick: l,
			onKeydown: Nt(jt(l, ["prevent"]), ["enter"])
		}), {
			default: g(() => [he(t.$slots, "default", {
				modelValue: y(s),
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
		]), y(f) && e.name ? (h(), C(y(nn), r({
			key: 0,
			type: "checkbox",
			name: e.name,
			disabled: y(o),
			required: e.required,
			value: e.value,
			checked: c.value
		}, y(p)), null, 16, [
			"name",
			"disabled",
			"required",
			"value",
			"checked"
		])) : T("v-if", !0)], 64));
	}
}), Y = /* @__PURE__ */ P({
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
		return Kt(), (n, r) => (h(), C(y(Qt), {
			"data-state": y(t).checked.value ? "checked" : "unchecked",
			"data-disabled": y(t).disabled.value ? "" : void 0,
			"as-child": e.asChild,
			as: e.as
		}, {
			default: g(() => [he(n.$slots, "default")]),
			_: 3
		}, 8, [
			"data-state",
			"data-disabled",
			"as-child",
			"as"
		]));
	}
}), sn = /* @__PURE__ */ P({
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
		let n = e, i = t, a = Jt(D(() => {
			let { class: e, ...t } = n;
			return t;
		}), i);
		return (e, t) => (h(), C(y(on), r(y(a), {
			as: "button",
			type: "button",
			class: y(pe)("peer focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-input inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50", n.class)
		}), {
			default: g(() => [S(y(Y), { class: "bg-background pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" })]),
			_: 1
		}, 16, ["class"]));
	}
}), X = typeof window < "u" && typeof document < "u";
typeof WorkerGlobalScope < "u" && globalThis instanceof WorkerGlobalScope;
var cn = (e) => e !== void 0;
X && window.document, X && window.navigator, X && window.location;
function ln(e) {
	return JSON.parse(JSON.stringify(e));
}
/* @__NO_SIDE_EFFECTS__ */
function un(e, t, n, r = {}) {
	var i, a;
	let { clone: o = !1, passive: s = !1, eventName: c, deep: l = !1, defaultValue: u, shouldEmit: d } = r, f = se(), p = n || f?.emit || (f == null || (i = f.$emit) == null ? void 0 : i.bind(f)) || (f == null || (a = f.proxy) == null || (a = a.$emit) == null ? void 0 : a.bind(f?.proxy)), h = c;
	t ||= "modelValue", h ||= `update:${t.toString()}`;
	let g = (e) => o ? typeof o == "function" ? o(e) : ln(e) : e, _ = () => cn(e[t]) ? g(e[t]) : u, ee = (e) => {
		d ? d(e) && p(h, e) : p(h, e);
	};
	if (s) {
		let n = _(), r = v(n), i = !1;
		return m(() => e[t], (e) => {
			i || (i = !0, r.value = g(e), N(() => i = !1));
		}), m(r, (n) => {
			!i && (n !== e[t] || l) && ee(n);
		}, { deep: l }), r;
	}
	return D({
		get() {
			return _();
		},
		set(e) {
			ee(e);
		}
	});
}
// src/components/ui/Input.vue?vue&type=script&setup=true&lang.ts
var dn = ["type", "placeholder"], Z = /* @__PURE__ */ P({
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
		return (t, i) => o((h(), k("input", {
			"onUpdate:modelValue": i[0] ||= (e) => l(r) ? r.value = e : null,
			type: e.type ?? "text",
			placeholder: e.placeholder,
			class: _e(y(pe)("border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50", n.class))
		}, null, 10, dn)), [[Et, y(r)]]);
	}
}), fn = ["id", "disabled"], pn = /* @__PURE__ */ P({
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
		return (t, i) => (h(), k("div", { class: _e(y(pe)("relative inline-block", n.class)) }, [o(M("select", {
			id: e.id,
			"onUpdate:modelValue": i[0] ||= (e) => l(r) ? r.value = e : null,
			disabled: e.disabled,
			class: "border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full cursor-pointer appearance-none rounded-md border py-2 pr-8 pl-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
		}, [he(t.$slots, "default")], 8, fn), [[xt, y(r)]]), i[1] ||= M("svg", {
			class: "text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2",
			width: "10",
			height: "6",
			viewBox: "0 0 10 6",
			fill: "none",
			"aria-hidden": "true"
		}, [M("path", {
			d: "M1 1L5 5L9 1",
			stroke: "currentColor",
			"stroke-width": "1.5",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		})], -1)], 2));
	}
}), mn = ["for"], Q = /* @__PURE__ */ P({
	__name: "Label",
	props: {
		for: { type: String },
		class: { type: String }
	},
	setup(e) {
		return (e, t) => (h(), k("label", {
			for: e.$props.for,
			class: _e(["text-sm leading-none font-medium", e.$props.class])
		}, [he(e.$slots, "default")], 10, mn));
	}
}), hn = { class: "inline_help" }, $ = /* @__PURE__ */ P({
	__name: "HelpText",
	setup(e) {
		return (e, t) => (h(), k("blockquote", hn, [he(e.$slots, "default")]));
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
], vn = /* @__PURE__ */ P({
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
		return (e, a) => (h(), k("div", gn, [(h(), k(O, null, t(r, (e) => M("button", {
			id: `incus-tab-${e.id}`,
			key: e.id,
			role: "tab",
			type: "button",
			"aria-selected": n.value === e.id,
			"aria-controls": `incus-panel-${e.id}`,
			tabindex: n.value === e.id ? 0 : -1,
			class: _e(["-mb-px cursor-pointer border-b-[3px] px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition-colors", n.value === e.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"]),
			onClick: (t) => n.value = e.id,
			onKeydown: (t) => i(t, e.id)
		}, w(e.label), 43, _n)), 64))]));
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
	let n = f(/* @__PURE__ */ new Map()), r = f(/* @__PURE__ */ new Map()), i = v([]), a = f(/* @__PURE__ */ new Map()), o = D(() => e.value.filter((e) => e.status.toLowerCase() === "running")), s = D(() => e.value.length - o.value.length), c = D(() => o.value.reduce((e, t) => e + Number(t.memoryUsageBytes ?? 0), 0)), l = D(() => o.value.reduce((e, t) => e + BigInt(t.cpuUsageNs ?? "0"), 0n));
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
var Cn = "query { incusConfig {\n  enabled stateDir storageDriver storageSource storagePoolName jailBridge jailSubnet jailNat jailIpv6\n  aclName aclBlock aclAllow aclDefaultEgress aclDefaultIngress jailProfile jailImage jailNesting jailCpu jailMemory\n  jailWorkspaceRoot jailAgentUid jailAgentGid jailBindMounts tsAuthKeyConfigured dashboardWidgetEnable\n} }", wn = "query { incusHealthy jails { name status ipv4 cpuUsageNs memoryUsageBytes memoryTotalBytes } }", Tn = "mutation($input: IncusConfigInput!) { updateIncusConfig(input: $input) { enabled } }", En = "mutation($name: String!, $action: JailAction!) { setJailState(name: $name, action: $action) }", Dn = "mutation($name: String!) { deleteJail(name: $name) }", On = "mutation($name: String!, $image: String, $allowSudo: Boolean) { launchJail(name: $name, image: $image, allowSudo: $allowSudo) }", kn = "query($name: String!) { jailDetail(name: $name) { name profiles imageOs imageRelease imageDescription storagePool networkBridge cpuLimit cpuLimitIsOverride memoryLimit memoryLimitIsOverride workspaceHostPath workspaceIsOverride sudoEnabled } }", An = "mutation($name: String!) { grantJailSudo(name: $name) }", jn = "mutation($name: String!, $command: String!) { startPrivilegedCommand(name: $name, command: $command) }", Mn = "query($id: String!) { privilegedCommandStatus(id: $id) { id command status exitCode stdout stderr message } }", Nn = "mutation($name: String!, $hostPath: String!) { setJailWorkspace(name: $name, hostPath: $hostPath) }", Pn = "mutation($name: String!) { clearJailWorkspace(name: $name) }", Fn = "mutation($name: String!, $cpu: String, $memory: String) { setJailLimits(name: $name, cpu: $cpu, memory: $memory) }", In = "mutation($distro: String!, $release: String!, $packages: [String!]!, $alias: String!, $basedOn: String, $postInstallCommands: [String!]) { buildJailImage(distro: $distro, release: $release, packages: $packages, alias: $alias, basedOn: $basedOn, postInstallCommands: $postInstallCommands) }", Ln = "mutation($alias: String!) { deleteJailImage(alias: $alias) }", Rn = "query($query: String!, $distro: String, $release: String) { searchAllPackages(query: $query, distro: $distro, release: $release) { results { ecosystem name description version } errors { ecosystem message } } }", zn = "query($buildId: String!) { jailImageBuildStatus(buildId: $buildId) { id status alias distro release packages logTail error } }", Bn = "query { builderPresets { name distro release packages } }", Vn = "mutation($input: BuilderPresetInput!) { saveBuilderPreset(input: $input) { name } }", Hn = "mutation($name: String!) { deleteBuilderPreset(name: $name) }", Un = "query { jailImages { alias distro release packages isMaster basedOn createdAt } }", Wn = "mutation($alias: String!, $isMaster: Boolean!) { setMasterImage(alias: $alias, isMaster: $isMaster) { alias isMaster } }", Gn = "mutation { pruneStaleImageRecords }", Kn = "mutation($name: String!) { migrateJailWorkspace(name: $name) }", qn = "mutation($name: String!, $formula: String!) { installHomebrewFormula(name: $name, formula: $formula) }", Jn = "query($id: String!) { homebrewInstallStatus(id: $id) { id formula status message } }";
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
			let r = await j(kn, { name: e });
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
}, $n = { class: "mb-6 flex items-center gap-3 border-b border-border pb-4" }, er = { class: "ml-auto flex items-center gap-3" }, tr = {
	key: 1,
	id: "incus-panel-builder",
	role: "tabpanel",
	"aria-labelledby": "incus-tab-builder",
	tabindex: "0"
}, nr = { class: "grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]" }, rr = { class: "mb-6 rounded-lg border border-border bg-card p-4 xl:mb-0" }, ir = {
	key: 0,
	class: "mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, ar = {
	key: 1,
	class: "text-sm text-muted-foreground"
}, or = {
	key: 2,
	class: "mb-3 flex flex-wrap gap-2"
}, sr = ["onClick"], cr = { class: "font-mono text-muted-foreground" }, lr = ["onClick"], ur = { class: "flex gap-2" }, dr = { class: "mt-5 border-t border-border pt-4" }, fr = { class: "mb-2 flex items-center justify-between gap-3" }, pr = {
	key: 0,
	class: "mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, mr = {
	key: 1,
	class: "mb-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs"
}, hr = {
	key: 2,
	class: "text-sm text-muted-foreground"
}, gr = {
	key: 3,
	class: "flex flex-col gap-2"
}, _r = { class: "min-w-0 flex-1" }, vr = { class: "flex items-center gap-2" }, yr = { class: "font-mono text-[13px] font-medium" }, br = { class: "text-xs text-muted-foreground" }, xr = { class: "mt-0.5 truncate text-xs text-muted-foreground" }, Sr = { class: "mt-5 border-t border-border pt-4" }, Cr = ["aria-expanded"], wr = {
	key: 0,
	id: "config-import-panel",
	class: "mt-3 flex flex-col gap-4"
}, Tr = {
	key: 0,
	class: "mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Er = {
	key: 1,
	class: "mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs"
}, Dr = {
	key: 0,
	class: "text-foreground"
}, Or = {
	key: 1,
	class: "mt-1"
}, kr = { class: "font-mono" }, Ar = {
	key: 2,
	class: "mt-1"
}, jr = {
	key: 3,
	class: "mt-1"
}, Mr = { class: "ml-4 list-disc text-muted-foreground" }, Nr = { class: "border-t border-border pt-4" }, Pr = { class: "flex gap-2" }, Fr = {
	key: 0,
	class: "mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Ir = {
	key: 1,
	class: "mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs"
}, Lr = { class: "font-mono" }, Rr = { class: "border-t border-border pt-4" }, zr = { class: "flex flex-wrap gap-2" }, Br = { class: "mb-6 rounded-lg border border-border bg-card p-4" }, Vr = {
	key: 0,
	class: "mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
}, Hr = {
	key: 1,
	class: "mb-4 flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs"
}, Ur = { class: "font-mono font-medium" }, Wr = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, Gr = { class: "flex justify-self-end gap-2" }, Kr = ["value"], qr = { class: "flex justify-self-end gap-2" }, Jr = ["value"], Yr = { class: "mt-5 border-t border-border pt-4" }, Xr = {
	key: 0,
	class: "mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Zr = {
	key: 1,
	class: "mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
}, Qr = {
	key: 2,
	class: "mt-2 text-xs text-muted-foreground"
}, $r = {
	key: 3,
	class: "mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto"
}, ei = { class: "min-w-0 flex-1" }, ti = { class: "font-mono font-medium" }, ni = {
	key: 0,
	class: "ml-1.5 font-mono text-muted-foreground"
}, ri = {
	key: 1,
	class: "truncate text-muted-foreground"
}, ii = {
	key: 1,
	class: "shrink-0 text-muted-foreground"
}, ai = {
	key: 4,
	class: "mt-2 text-xs text-muted-foreground"
}, oi = {
	key: 5,
	class: "mt-3"
}, si = { class: "flex flex-wrap gap-1.5" }, ci = ["aria-label", "onClick"], li = {
	key: 6,
	class: "mt-3"
}, ui = { class: "flex flex-col gap-1" }, di = { class: "flex-1" }, fi = ["aria-label", "onClick"], pi = { class: "mt-4" }, mi = { class: "mt-4 flex justify-end" }, hi = { class: "rounded-lg border border-border bg-card p-4" }, gi = {
	key: 0,
	class: "flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2.5"
}, _i = {
	key: 1,
	class: "flex flex-col gap-4"
}, vi = { class: "mb-2 flex items-center justify-between gap-3" }, yi = { class: "flex items-center gap-2" }, bi = { class: "text-sm font-medium" }, xi = { class: "text-xs text-muted-foreground" }, Si = {
	key: 0,
	class: "mb-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Ci = { class: "flex items-center gap-2 rounded-t-md border border-b-0 border-neutral-800 bg-neutral-950 px-3 py-1.5" }, wi = { class: "font-mono text-[11px] text-neutral-400" }, Ti = { class: "max-h-48 overflow-auto rounded-b-md border border-neutral-800 bg-neutral-950 p-2.5 text-xs font-mono whitespace-pre-wrap text-neutral-200" }, Ei = {
	key: 2,
	id: "incus-panel-jails",
	role: "tabpanel",
	"aria-labelledby": "incus-tab-jails",
	tabindex: "0"
}, Di = { class: "mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" }, Oi = { class: "rounded-lg border border-border bg-card p-3" }, ki = { class: "mt-1 font-mono text-xl" }, Ai = { class: "rounded-lg border border-border bg-card p-3" }, ji = { class: "mt-1 font-mono text-xl" }, Mi = { class: "rounded-lg border border-border bg-card p-3" }, Ni = { class: "mt-1 font-mono text-xl" }, Pi = { class: "rounded-lg border border-border bg-card p-3" }, Fi = { class: "mt-1.5" }, Ii = { class: "rounded-lg border border-border bg-card p-3" }, Li = { class: "mt-1 font-mono text-xl" }, Ri = { class: "rounded-lg border border-border bg-card p-3" }, zi = { class: "mt-1 font-mono text-xl" }, Bi = {
	key: 0,
	viewBox: "0 0 80 24",
	width: "80",
	height: "24",
	class: "mt-1 text-primary",
	preserveAspectRatio: "none"
}, Vi = ["points"], Hi = { class: "mb-6 grid grid-cols-1 items-start gap-4 xl:grid-cols-2" }, Ui = { class: "rounded-lg border border-border bg-card p-4" }, Wi = { class: "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3" }, Gi = { class: "mt-1 font-mono text-sm" }, Ki = { class: "mt-1 font-mono text-sm" }, qi = { class: "mt-1 font-mono text-sm" }, Ji = { class: "mt-1 font-mono text-sm" }, Yi = { class: "mt-1 font-mono text-sm" }, Xi = { class: "rounded-lg border border-border bg-card p-4" }, Zi = { class: "flex flex-col gap-3 sm:flex-row sm:items-end" }, Qi = { class: "flex-1" }, $i = { class: "flex-1" }, ea = { value: "" }, ta = ["value"], na = {
	key: 0,
	class: "mt-2 text-xs text-destructive"
}, ra = { class: "mt-3 flex items-center gap-2.5" }, ia = { class: "rounded-lg border border-border bg-card p-4" }, aa = { class: "mb-4 flex items-center justify-between gap-3" }, oa = {
	key: 0,
	class: "text-sm text-muted-foreground"
}, sa = { class: "mb-3 text-xs text-muted-foreground" }, ca = { class: "grid grid-cols-1 gap-4 xl:grid-cols-2" }, la = { class: "flex flex-wrap items-center justify-between gap-2" }, ua = { class: "flex min-w-0 items-center gap-2" }, da = { class: "truncate font-mono text-[13px] font-medium" }, fa = {
	key: 0,
	class: "shrink-0 inline-flex items-center rounded-full bg-unraid-green-200 px-1.5 py-0.5 text-[10px] font-semibold text-unraid-green-800",
	title: "This container's IPv4 falls within the configured subnet."
}, pa = { class: "shrink-0 font-mono text-xs text-muted-foreground" }, ma = { class: "mt-3 grid grid-cols-2 gap-3" }, ha = ["title"], ga = { class: "mt-1 flex items-center gap-2" }, _a = { class: "h-1.5 w-16 overflow-hidden rounded-full bg-muted" }, va = { class: "font-mono text-[13px]" }, ya = {
	key: 0,
	viewBox: "0 0 80 24",
	width: "60",
	height: "18",
	class: "text-primary",
	preserveAspectRatio: "none"
}, ba = ["points"], xa = { class: "mt-1 flex items-center gap-2" }, Sa = { class: "font-mono text-[13px]" }, Ca = {
	key: 0,
	viewBox: "0 0 80 24",
	width: "60",
	height: "18",
	class: "text-primary",
	preserveAspectRatio: "none"
}, wa = ["points"], Ta = {
	key: 0,
	class: "mt-1 h-1 w-20 overflow-hidden rounded-full bg-muted"
}, Ea = { class: "mt-3 flex flex-wrap gap-2" }, Da = {
	key: 0,
	class: "mt-3 rounded-md border border-border bg-muted/30 p-3"
}, Oa = {
	key: 0,
	class: "text-xs text-muted-foreground"
}, ka = { class: "grid grid-cols-2 gap-3 sm:grid-cols-4" }, Aa = { class: "mt-1 font-mono text-xs" }, ja = { class: "mt-1 font-mono text-xs" }, Ma = { class: "mt-1 font-mono text-xs" }, Na = { class: "mt-1 font-mono text-xs" }, Pa = { class: "mt-4 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2" }, Fa = { class: "flex flex-wrap items-end gap-2" }, Ia = { class: "flex gap-1.5" }, La = { class: "flex gap-1.5" }, Ra = { class: "flex gap-2" }, za = {
	key: 0,
	class: "mt-3 flex flex-wrap items-center gap-3 rounded-md border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs"
}, Ba = {
	key: 1,
	class: "mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
}, Va = { class: "mt-4 border-t border-border pt-3" }, Ha = { class: "mb-1 flex items-center gap-1.5 text-xs font-medium" }, Ua = { class: "mt-4 border-t border-border pt-3" }, Wa = { class: "flex flex-wrap gap-2" }, Ga = {
	key: 0,
	class: "mt-1.5 text-xs text-unraid-green-800"
}, Ka = {
	key: 1,
	class: "mt-1.5 text-xs text-destructive"
}, qa = { class: "mt-4 border-t border-border pt-3" }, Ja = { class: "flex flex-wrap gap-2" }, Ya = {
	key: 0,
	class: "mt-2"
}, Xa = {
	key: 0,
	class: "mt-1 max-h-40 overflow-auto rounded-md border border-neutral-800 bg-neutral-950 p-2 text-[11px] whitespace-pre-wrap text-neutral-200"
}, Za = {
	key: 3,
	id: "incus-panel-config",
	role: "tabpanel",
	"aria-labelledby": "incus-tab-config",
	tabindex: "0"
}, Qa = { class: "columns-1 gap-4 xl:columns-2" }, $a = { class: "mb-4 break-inside-avoid rounded-lg border border-border bg-card p-4" }, eo = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, to = { class: "mt-4 border-t border-border pt-4" }, no = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, ro = { class: "mb-4 break-inside-avoid rounded-lg border border-border bg-card p-4" }, io = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, ao = { class: "mt-4 border-t border-border pt-4" }, oo = {
	key: 0,
	class: "mb-2 flex flex-wrap gap-1.5"
}, so = ["aria-label", "onClick"], co = { class: "flex gap-2" }, lo = {
	key: 1,
	class: "mt-1.5 text-xs text-destructive"
}, uo = { class: "mt-4" }, fo = {
	key: 0,
	class: "mb-2 flex flex-wrap gap-1.5"
}, po = ["aria-label", "onClick"], mo = { class: "flex gap-2" }, ho = {
	key: 1,
	class: "mt-1.5 text-xs text-destructive"
}, go = { class: "mt-4 border-t border-border pt-4" }, _o = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, vo = { class: "flex justify-self-end gap-2" }, yo = { class: "mb-4 break-inside-avoid rounded-lg border border-border bg-card p-4" }, bo = { class: "grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4" }, xo = {
	key: 0,
	class: "col-span-2 -mt-2 text-xs text-destructive"
}, So = {
	key: 1,
	class: "col-span-2 -mt-2 text-xs text-destructive"
}, Co = { class: "mt-4 border-t border-border pt-4" }, wo = { class: "mb-8 flex justify-end" }, To = 5e3, Eo = "__other__", Do = "__other__", Oo = 400, ko = /* @__PURE__ */ lt(/* @__PURE__ */ P({
	__name: "App",
	setup(e) {
		let n = ke(() => import("./incus-settings-Terminal-DLA3-l2Z.js")), r = v("jails"), i = v(!0), s = v(!1), c = v(null), u = v(!1), d = v([]), p = v(""), _ = D(() => gt(p.value)), ee = D(() => W(x.jailCpu)), ne = D(() => ht(x.jailMemory)), b = v(""), re = v(!1), ie = v(null), x = f({
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
		}), { runningJails: ae, stoppedJailsCount: oe, totalMemoryUsageBytes: se, totalCpuUsageNs: ce, fleetHistory: le, formatDuration: ue, formatBytes: de, formatMemory: pe, memoryFillPct: me, updateCpuSamplesAndHistory: he, cpuRateLabel: ge, cpuRatePct: ve, cpuRateSuffix: be, jailCpuHistory: xe, totalCpuRateLabel: Se, sparklinePoints: Ce } = Sn(d, () => x.jailCpu), we = D(() => x.storageDriver === "zfs"), Te = v(!1), Ee = v(""), De = v(!1), N = !1;
		async function Ae() {
			let e = await j(Cn);
			N && (Object.assign(x, e.incusConfig), x.jailIpv6 = "none");
		}
		let P = 0;
		async function F() {
			let e = ++P;
			try {
				let t = await j(wn);
				if (e !== P) return;
				u.value = t.incusHealthy, d.value = t.jails, he();
			} catch {
				if (e !== P) return;
				u.value = !1;
			}
		}
		a(async () => {
			N = !0;
			try {
				if (await Ae(), !N || (await F(), !N)) return;
				await Promise.all([os(), ps()]);
			} catch (e) {
				if (!N) return;
				c.value = e instanceof Error ? e.message : String(e);
			} finally {
				N && (i.value = !1);
			}
			N && r.value === "jails" && Pt();
		}), m(r, (e) => {
			e === "jails" ? (F(), Pt()) : Ft();
		});
		async function je() {
			s.value = !0, c.value = null;
			try {
				let e = xn(x, {
					replacement: Ee.value,
					clear: De.value
				});
				await j(Tn, { input: e }), (De.value || Ee.value) && (x.tsAuthKeyConfigured = !De.value, Ee.value = "", De.value = !1), await F();
			} catch (e) {
				c.value = e instanceof Error ? e.message : String(e);
			} finally {
				s.value = !1;
			}
		}
		async function Me(e, t) {
			c.value = null;
			try {
				await j(En, {
					name: e,
					action: t
				}), await F();
			} catch (e) {
				c.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function Ne(e) {
			if (confirm(`Delete container "${e}"? This cannot be undone.`)) {
				c.value = null;
				try {
					await j(Dn, { name: e }), await F();
				} catch (e) {
					c.value = e instanceof Error ? e.message : String(e);
				}
			}
		}
		let Pe = v(!1);
		async function Fe() {
			if (confirm("Delete every stopped container? Running containers are never touched. This cannot be undone.")) {
				Pe.value = !0, c.value = null;
				try {
					(await j("mutation { deleteStoppedJails }")).deleteStoppedJails.length === 0 && (c.value = "No stopped containers to delete."), await F();
				} catch (e) {
					c.value = e instanceof Error ? e.message : String(e);
				} finally {
					Pe.value = !1;
				}
			}
		}
		async function I() {
			if (p.value.trim() && !_.value) {
				c.value = null;
				try {
					await j(On, {
						name: p.value.trim(),
						image: b.value || null,
						allowSudo: re.value
					}), p.value = "", re.value = !1, await F();
				} catch (e) {
					c.value = e instanceof Error ? e.message : String(e);
				}
			}
		}
		let L = v(!1), { detailsJailName: R, jailDetail: z, detailLoading: Ie, detailError: B, editCpuLimit: Le, editMemoryLimit: Re, editWorkspacePath: ze, toggleJailDetails: Be, loadJailDetail: V } = Yn(() => {
			$e(), Ye.value = !1, ot(), it.value = !1, H.value = "", Xe.value = "", Ze.value = "", rt.value = "", U.value = null;
		});
		async function Ve() {
			if (!R.value) return;
			let e = W(Le.value);
			if (e) B.value = e;
			else {
				L.value = !0, B.value = "";
				try {
					await j(Fn, {
						name: R.value,
						cpu: Le.value.trim()
					}), await V(R.value);
				} catch (e) {
					B.value = e instanceof Error ? e.message : String(e);
				} finally {
					L.value = !1;
				}
			}
		}
		async function He() {
			if (!R.value) return;
			let e = ht(Re.value);
			if (e) B.value = e;
			else {
				L.value = !0, B.value = "";
				try {
					await j(Fn, {
						name: R.value,
						memory: Re.value.trim()
					}), await V(R.value);
				} catch (e) {
					B.value = e instanceof Error ? e.message : String(e);
				} finally {
					L.value = !1;
				}
			}
		}
		async function Ue() {
			if (R.value) {
				Le.value = "", Re.value = "", L.value = !0, B.value = "";
				try {
					await j(Fn, {
						name: R.value,
						cpu: "",
						memory: ""
					}), await V(R.value);
				} catch (e) {
					B.value = e instanceof Error ? e.message : String(e);
				} finally {
					L.value = !1;
				}
			}
		}
		async function We() {
			if (R.value && ze.value.trim()) {
				L.value = !0, B.value = "";
				try {
					await j(Nn, {
						name: R.value,
						hostPath: ze.value.trim()
					}), await V(R.value);
				} catch (e) {
					B.value = e instanceof Error ? e.message : String(e);
				} finally {
					L.value = !1;
				}
			}
		}
		async function Ge() {
			if (R.value) {
				L.value = !0, B.value = "";
				try {
					await j(Pn, { name: R.value }), await V(R.value);
				} catch (e) {
					B.value = e instanceof Error ? e.message : String(e);
				} finally {
					L.value = !1;
				}
			}
		}
		function Ke(e) {
			return !e.workspaceIsOverride && !!e.workspaceHostPath?.endsWith("/default-workspace");
		}
		let qe = v(!1);
		async function Je() {
			if (R.value) {
				qe.value = !0, B.value = "";
				try {
					await j(Kn, { name: R.value }), await V(R.value);
				} catch (e) {
					B.value = e instanceof Error ? e.message : String(e);
				} finally {
					qe.value = !1;
				}
			}
		}
		let H = v(""), Ye = v(!1), Xe = v(""), Ze = v(""), Qe = null;
		function $e() {
			Qe !== null && (Qe.stop(), Qe = null);
		}
		async function et() {
			if (!R.value || !H.value.trim()) return;
			let e = R.value;
			$e(), Ye.value = !0, Xe.value = "", Ze.value = "";
			try {
				let t = (await j(qn, {
					name: e,
					formula: H.value.trim()
				})).installHomebrewFormula;
				Qe = bn(async (n) => {
					try {
						let r = await j(Jn, { id: t });
						if (!n.isActive() || R.value !== e) return;
						let i = r.homebrewInstallStatus;
						if (!i || i.status === "running") return;
						$e(), Ye.value = !1, i.status === "success" ? (Xe.value = i.message, H.value = "") : Ze.value = i.message;
					} catch (t) {
						if (!n.isActive() || R.value !== e) return;
						$e(), Ye.value = !1, Ze.value = t instanceof Error ? t.message : String(t);
					}
				}, yn);
			} catch (e) {
				Ze.value = e instanceof Error ? e.message : String(e), Ye.value = !1;
			}
		}
		let tt = v(!1);
		async function nt() {
			if (R.value) {
				tt.value = !0, B.value = "";
				try {
					await j(An, { name: R.value }), await V(R.value);
				} catch (e) {
					B.value = e instanceof Error ? e.message : String(e);
				} finally {
					tt.value = !1;
				}
			}
		}
		let rt = v(""), it = v(!1), U = v(null), at = null;
		function ot() {
			at !== null && (at.stop(), at = null);
		}
		async function st() {
			if (R.value && rt.value.trim()) {
				ot(), it.value = !0, U.value = null, B.value = "";
				try {
					let e = (await j(jn, {
						name: R.value,
						command: rt.value.trim()
					})).startPrivilegedCommand, t = R.value;
					at = bn(async (n) => {
						try {
							let r = await j(Mn, { id: e });
							if (!n.isActive() || R.value !== t) return;
							let i = r.privilegedCommandStatus;
							if (!i || i.status === "running") return;
							ot(), it.value = !1, U.value = i;
						} catch (e) {
							if (!n.isActive() || R.value !== t) return;
							ot(), it.value = !1, B.value = e instanceof Error ? e.message : String(e);
						}
					}, yn);
				} catch (e) {
					B.value = e instanceof Error ? e.message : String(e), it.value = !1;
				}
			}
		}
		function ct(e) {
			let t = e.toLowerCase();
			return t === "running" ? "green" : t === "stopped" ? "gray" : "orange";
		}
		function lt(e) {
			return e.split(",").map((e) => e.trim()).filter((e) => e.length > 0);
		}
		function ut() {
			return lt(x.aclBlock).length;
		}
		let dt = /^[0-9a-fA-F:.]+\/\d{1,3}$/, ft = /^\d+(-\d+)?(,\d+(-\d+)?)*$/, pt = /^\d+(\.\d+)?(B|KB|MB|GB|TB|PB|KiB|MiB|GiB|TiB|PiB)?$/i, mt = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
		function W(e) {
			return e.trim() ? ft.test(e.trim()) ? "" : `"${e}" doesn't look like a CPU limit — expected a core count (e.g. 2) or a set/range (e.g. 0-3).` : "";
		}
		function ht(e) {
			return e.trim() ? pt.test(e.trim()) ? "" : `"${e}" doesn't look like a memory limit — expected a byte count with an optional unit (e.g. 4GiB).` : "";
		}
		function gt(e) {
			return e.trim() ? mt.test(e.trim()) ? "" : `"${e}" isn't a valid container name — letters, digits, and hyphens only, can't start or end with a hyphen.` : "";
		}
		let vt = D(() => lt(x.aclBlock)), yt = D(() => lt(x.aclAllow)), bt = v(""), xt = v(""), St = v(""), Ct = v("");
		function wt() {
			let e = bt.value.trim();
			St.value = "", e && (dt.test(e) ? vt.value.includes(e) ? St.value = `${e} is already in the list.` : (x.aclBlock = [...vt.value, e].join(","), bt.value = "") : St.value = `"${e}" doesn't look like a CIDR — expected e.g. 10.0.0.0/8 or fd00::/8.`);
		}
		function Tt(e) {
			x.aclBlock = vt.value.filter((t) => t !== e).join(",");
		}
		function Et() {
			let e = xt.value.trim();
			Ct.value = "", e && (dt.test(e) ? yt.value.includes(e) ? Ct.value = `${e} is already in the list.` : (x.aclAllow = [...yt.value, e].join(","), xt.value = "") : Ct.value = `"${e}" doesn't look like a CIDR — expected e.g. 100.64.0.0/10 or fd00::/8.`);
		}
		function Dt(e) {
			x.aclAllow = yt.value.filter((t) => t !== e).join(",");
		}
		function Ot(e) {
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
		function kt(e, t) {
			let [n, r] = t.split("/");
			if (!n || r === void 0) return !1;
			let i = Number(r);
			if (!Number.isInteger(i) || i < 0 || i > 32) return !1;
			let a = Ot(e), o = Ot(n);
			if (a === null || o === null) return !1;
			if (i === 0) return !0;
			let s = 4294967295 << 32 - i >>> 0;
			return (a & s) === (o & s);
		}
		function At(e) {
			return !e.ipv4 || !x.jailSubnet || e.status.toLowerCase() !== "running" ? !1 : kt(e.ipv4, x.jailSubnet);
		}
		let Mt = null;
		function Pt() {
			Ft(), Mt = bn(F, To);
		}
		function Ft() {
			Mt !== null && (Mt.stop(), Mt = null);
		}
		let It = [
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
		], G = {
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
		}, Lt = {
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
		}, K = v("debian"), q = v(""), Rt = v(""), J = v(""), zt = D(() => K.value === Eo), Bt = D(() => q.value === Do), Vt = D(() => zt.value ? Rt.value : K.value), Ht = D(() => Bt.value ? J.value : q.value), Ut = D(() => G[K.value] ?? []);
		m(K, () => {
			let e = G[K.value];
			q.value = e && e.length > 0 ? e[0].value : Do, J.value = "";
		});
		{
			let e = G[K.value];
			q.value = e && e.length > 0 ? e[0].value : Do;
		}
		let Wt = v(""), Gt = v(""), Kt = v(!1), qt = v(null), Jt = v([]), Yt = v(null), Xt = v(!1);
		function Zt(e) {
			return e.split(/[\n,]/).map((e) => e.trim()).filter((e) => e.length > 0);
		}
		function Qt() {
			let e = Zt(Wt.value);
			return Array.from(/* @__PURE__ */ new Set([...Array.from(Y), ...e]));
		}
		let $t = v(""), en = v([]), tn = v([]), nn = v(!1), rn = v(null), an = null, on = 0, Y = f(/* @__PURE__ */ new Set()), X = f(/* @__PURE__ */ new Map()), cn = {
			apt: "apt",
			npm: "npm",
			pypi: "PyPI",
			brew: "brew"
		};
		function ln() {
			an && clearTimeout(an), an = null, ++on, $t.value.trim().length < 2 ? (en.value = [], tn.value = [], rn.value = null) : an = setTimeout(un, Oo);
		}
		m($t, ln), m(K, () => {
			Y.clear(), X.clear(), ln();
		});
		async function un() {
			let e = $t.value.trim();
			if (e.length < 2) return;
			let t = on;
			nn.value = !0, rn.value = null;
			try {
				let n = await j(Rn, {
					query: e,
					distro: Vt.value,
					release: Ht.value
				});
				if (t !== on) return;
				en.value = n.searchAllPackages.results, tn.value = n.searchAllPackages.errors;
			} catch (e) {
				if (t !== on) return;
				rn.value = e instanceof Error ? e.message : String(e), en.value = [], tn.value = [];
			} finally {
				t === on && (nn.value = !1);
			}
		}
		function dn(e) {
			Y.add(e.name);
		}
		function fn(e) {
			Y.delete(e);
		}
		function mn(e) {
			let t = Lt[K.value]?.find((t) => t.key === e);
			if (t) for (let e of t.packages) Y.add(e);
		}
		function hn(e) {
			mn("nodejs"), X.set(`npm:${e.name}`, `npm install -g ${e.name}`);
		}
		function gn(e) {
			mn("python3"), X.set(`pypi:${e.name}`, `pip3 install ${e.name}`);
		}
		function _n(e) {
			X.delete(e);
		}
		function kn(e) {
			e.ecosystem === "apt" ? dn(e) : e.ecosystem === "npm" ? hn(e) : e.ecosystem === "pypi" && gn(e);
		}
		function ko(e) {
			return e.ecosystem === "apt" ? Y.has(e.name) : e.ecosystem === "npm" ? X.has(`npm:${e.name}`) : e.ecosystem === "pypi" && X.has(`pypi:${e.name}`);
		}
		function Ao(e, t) {
			It.some((t) => t.value === e) ? (K.value = e, (G[e] ?? []).some((e) => e.value === t) ? (q.value = t, J.value = "") : (q.value = Do, J.value = t)) : (K.value = Eo, Rt.value = e, q.value = Do, J.value = t);
		}
		function jo() {
			Yt.value = null;
		}
		function Mo(e) {
			let t = e.toLowerCase(), n = (e) => e.find((e) => t.includes(e));
			if (t.includes("alpine")) {
				let e = t.match(/(\d+\.\d+)/)?.[1];
				return {
					distro: "alpinelinux",
					release: e && G.alpinelinux.some((t) => t.value === e) ? e : "3.24"
				};
			}
			if (t.includes("fedora")) {
				let e = t.match(/fedora[:\-](\d+)/)?.[1];
				return {
					distro: "fedora",
					release: e && G.fedora.some((t) => t.value === e) ? e : "44"
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
				release: r && G.ubuntu.some((e) => e.value === r) ? r : "noble"
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
				release: i && G.debian.some((e) => e.value === i) ? i : "bookworm"
			} : null;
		}
		function No(e) {
			let t = e.toLowerCase();
			return t.includes("/node") ? "nodejs" : t.includes("/python") ? "python3" : null;
		}
		function Po(e) {
			let t = JSON.parse(Fo(e)), n = {
				distroSet: !1,
				packagesAdded: [],
				commandsAdded: [],
				skipped: []
			};
			if (jo(), Y.clear(), X.clear(), Wt.value = "", typeof t.image == "string") {
				let e = Mo(t.image);
				e ? (Ao(e.distro, e.release), n.distroSet = !0) : n.skipped.push(`image "${t.image}" — couldn't infer a matching distro/release, pick manually`);
			} else t.build && n.skipped.push("\"build.dockerfile\" — Dockerfile-based devcontainers aren't translated, pick a distro/release manually");
			if (t.features && typeof t.features == "object") for (let e of Object.keys(t.features)) {
				let t = No(e);
				if (t) {
					let e = Lt[K.value]?.find((e) => e.key === t);
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
		function Fo(e) {
			return e.replace(/\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1");
		}
		let Io = v(null), Lo = v(null), Ro = v(null);
		function zo() {
			Ro.value?.click();
		}
		function Bo(e) {
			let t = e.target.files?.[0];
			if (!t) return;
			Io.value = null, Lo.value = null;
			let n = new FileReader();
			n.onload = () => {
				try {
					Lo.value = Po(String(n.result));
				} catch (e) {
					Io.value = e instanceof Error ? e.message : String(e);
				}
			}, n.onerror = () => {
				Io.value = "Failed to read the file.";
			}, n.readAsText(t), e.target.value = "";
		}
		function Vo(e) {
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
		function Ho(e) {
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
		function Uo() {
			mn("build-tools"), Y.has("curl") || Y.add("curl"), Y.has("ca-certificates") || Y.add("ca-certificates"), X.set("mise:env", "export MISE_DATA_DIR=/opt/mise MISE_CONFIG_DIR=/etc/mise"), X.set("mise:install", "curl https://mise.run | MISE_INSTALL_PATH=/usr/local/bin/mise sh"), X.set("mise:profile", "printf 'export MISE_DATA_DIR=/opt/mise MISE_CONFIG_DIR=/etc/mise\\neval \"$(/usr/local/bin/mise activate bash)\"\\n' > /etc/profile.d/mise.sh && chmod +x /etc/profile.d/mise.sh");
		}
		function Wo(e) {
			if (e.length === 0) return [];
			Uo();
			let t = e.map((e) => `${e.tool}@${e.version}`);
			return X.set("mise:use-tools", `mise use -g ${t.join(" ")}`), t;
		}
		async function Go(e) {
			let t = Vo((await import("./incus-settings-dist-D2zpBM3p.js")).parse(e));
			if (t.length === 0) throw Error("No [tools] entries found in this mise.toml.");
			return { toolsAdded: Wo(t) };
		}
		function Ko(e) {
			let t = Ho(e);
			if (t.length === 0) throw Error("No tool/version lines found in this .tool-versions file.");
			return { toolsAdded: Wo(t) };
		}
		let qo = v(null), Jo = v(null), Yo = v(null), Xo = v(null);
		function Zo(e, t) {
			let n = e.target.files?.[0];
			if (!n) return;
			qo.value = null, Jo.value = null;
			let r = new FileReader();
			r.onload = async () => {
				try {
					let e = t === "toml" ? await Go(String(r.result)) : Ko(String(r.result));
					Jo.value = e.toolsAdded;
				} catch (e) {
					qo.value = e instanceof Error ? e.message : String(e);
				}
			}, r.onerror = () => {
				qo.value = "Failed to read the file.";
			}, r.readAsText(n), e.target.value = "";
		}
		let Qo = v(""), $o = v("");
		function es() {
			let e = Qo.value.trim();
			if (!e) return;
			Uo(), Y.has("git") || Y.add("git");
			let t = $o.value.trim(), n = t ? `git clone --depth 1 --branch ${t} ${e} /opt/dotfiles-src` : `git clone --depth 1 ${e} /opt/dotfiles-src`;
			X.set("mise:dotfiles-clone", n), X.set("mise:dotfiles-bootstrap", "cp /opt/dotfiles-src/mise.toml /opt/dotfiles-src/.mise.toml /etc/mise/config.d/dotfiles.toml 2>/dev/null; MISE_EXPERIMENTAL=1 mise bootstrap --yes || true");
		}
		function ts() {
			X.delete("mise:dotfiles-clone"), X.delete("mise:dotfiles-bootstrap"), Qo.value = "", $o.value = "";
		}
		let ns = v([]), rs = v(""), is = v(!1), as = v(null);
		async function os() {
			let e = await j(Bn);
			N && (ns.value = e.builderPresets);
		}
		async function ss() {
			let e = rs.value.trim();
			if (e) {
				as.value = null, is.value = !0;
				try {
					await j(Vn, { input: {
						name: e,
						distro: Vt.value.trim(),
						release: Ht.value.trim(),
						packages: Qt()
					} }), rs.value = "", await os();
				} catch (e) {
					as.value = e instanceof Error ? e.message : String(e);
				} finally {
					is.value = !1;
				}
			}
		}
		function cs(e) {
			Ao(e.distro, e.release), Wt.value = e.packages.join("\n"), Gt.value = "", jo();
		}
		async function ls(e) {
			as.value = null;
			try {
				await j(Hn, { name: e }), await os();
			} catch (e) {
				as.value = e instanceof Error ? e.message : String(e);
			}
		}
		let us = v([]), ds = v(null), fs = v(null);
		async function ps() {
			let e = await j(Un);
			N && (us.value = e.jailImages);
		}
		async function ms(e) {
			if (e.isMaster) return;
			ds.value = null, fs.value = e.alias;
			let t = us.value.find((e) => e.isMaster)?.alias ?? null;
			try {
				await j(Wn, {
					alias: e.alias,
					isMaster: !0
				}), await j(Tn, { input: { jailImage: e.alias } }), await Promise.all([ps(), Ae()]);
			} catch (n) {
				await Promise.allSettled([t ? j(Wn, {
					alias: t,
					isMaster: !0
				}) : j(Wn, {
					alias: e.alias,
					isMaster: !1
				})]), await Promise.allSettled([ps(), Ae()]), ds.value = n instanceof Error ? n.message : String(n);
			} finally {
				fs.value = null;
			}
		}
		function hs(e) {
			Ao(e.distro, e.release), Wt.value = e.packages.join("\n"), Gt.value = "", Yt.value = e.alias;
		}
		let gs = v(null);
		async function _s(e) {
			if (confirm(`Delete image "${e.alias}"? This removes it from Incus and cannot be undone.`)) {
				ds.value = null, gs.value = e.alias;
				try {
					await j(Ln, { alias: e.alias }), us.value = us.value.filter((t) => t.alias !== e.alias), Yt.value === e.alias && jo();
				} catch (e) {
					ds.value = e instanceof Error ? e.message : String(e);
				} finally {
					gs.value = null;
				}
			}
		}
		function vs(e) {
			return e.length === 0 ? "no packages" : e.join(", ");
		}
		let ys = v(!1), bs = v("");
		async function xs() {
			ys.value = !0, ds.value = null, bs.value = "";
			try {
				let e = await j(Gn);
				e.pruneStaleImageRecords.length === 0 ? bs.value = "Nothing to prune — every saved image still exists in Incus." : (bs.value = `Untracked ${e.pruneStaleImageRecords.length}: ${e.pruneStaleImageRecords.join(", ")}`, us.value = us.value.filter((t) => !e.pruneStaleImageRecords.includes(t.alias)));
			} catch (e) {
				ds.value = e instanceof Error ? e.message : String(e);
			} finally {
				ys.value = !1;
			}
		}
		function Ss(e) {
			e.intervalId !== null && (e.intervalId.stop(), e.intervalId = null);
		}
		function Cs(e) {
			e.intervalId = bn(async (t) => {
				try {
					let n = await j(zn, { buildId: e.buildId });
					if (!t.isActive()) return;
					if (e.status = n.jailImageBuildStatus, e.status?.status === "success") {
						Ss(e);
						try {
							await ps();
						} catch (e) {
							ds.value = e instanceof Error ? e.message : String(e);
						}
					} else e.status?.status === "failed" && Ss(e);
				} catch (n) {
					if (!t.isActive()) return;
					e.error = n instanceof Error ? n.message : String(n), Ss(e);
				}
			}, yn);
		}
		async function ws() {
			qt.value = null;
			let e = Vt.value.trim(), t = Ht.value.trim(), n = Gt.value.trim(), r = Qt();
			if (!e || !t || !n) qt.value = "Distro, release, and alias are required.";
			else {
				Kt.value = !0;
				try {
					let i = {
						buildId: (await j(In, {
							distro: e,
							release: t,
							packages: r,
							alias: n,
							basedOn: Yt.value || null,
							postInstallCommands: Array.from(X.values())
						})).buildJailImage,
						distro: e,
						release: t,
						alias: n,
						status: null,
						error: null,
						intervalId: null
					};
					Jt.value.unshift(i), Cs(Jt.value[0]);
					let a = G[K.value];
					q.value = a && a.length > 0 ? a[0].value : Do, J.value = "", Gt.value = "", Wt.value = "", Y.clear(), X.clear(), en.value = [], $t.value = "", Jo.value = null, qo.value = null, Qo.value = "", $o.value = "", jo();
				} catch (e) {
					qt.value = e instanceof Error ? e.message : String(e);
				} finally {
					Kt.value = !1;
				}
			}
		}
		function Ts(e) {
			switch (e) {
				case "success": return "green";
				case "failed": return "red";
				case "running": return "orange";
				default: return "gray";
			}
		}
		return te(() => {
			N = !1, ++P, ++on;
			for (let e of Jt.value) Ss(e);
			Ft(), $e(), ot(), an && clearTimeout(an);
		}), (e, a) => (h(), k("div", Xn, [i.value ? (h(), k("div", Zn, "Loading incus configuration…")) : (h(), k(O, { key: 1 }, [
			c.value ? (h(), k("div", Qn, w(c.value), 1)) : T("", !0),
			M("header", $n, [a[52] ||= fe("<svg width=\"14\" height=\"20\" viewBox=\"0 0 10 14\" fill=\"none\" aria-hidden=\"true\" class=\"shrink-0 text-foreground\"><path d=\"M5 0L9 2.5L5 5L1 2.5Z\" fill=\"currentColor\" opacity=\"0.95\"></path><path d=\"M5 3L9 5.5L5 8L1 5.5Z\" fill=\"currentColor\" opacity=\"0.7\"></path><path d=\"M5 6L9 8.5L5 11L1 8.5Z\" fill=\"currentColor\" opacity=\"0.45\"></path><path d=\"M5 9L9 11.5L5 14L1 11.5Z\" fill=\"currentColor\" opacity=\"0.25\"></path></svg><span class=\"text-sm font-semibold tracking-[0.14em] uppercase\">Incus</span><span class=\"text-xs text-muted-foreground\">dev containers</span>", 3), M("div", er, [S(y(ye), { variant: u.value ? "green" : "red" }, {
				default: g(() => [E(w(u.value ? "Reachable" : "Not running"), 1)]),
				_: 1
			}, 8, ["variant"]), S(y(A), {
				size: "sm",
				variant: "outline",
				onClick: F
			}, {
				default: g(() => [...a[51] ||= [E("Refresh", -1)]]),
				_: 1
			})])]),
			S(vn, {
				modelValue: r.value,
				"onUpdate:modelValue": a[0] ||= (e) => r.value = e
			}, null, 8, ["modelValue"]),
			r.value === "builder" ? (h(), k("section", tr, [
				M("div", nr, [M("div", null, [a[77] ||= M("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Starting points", -1), M("div", rr, [
					a[76] ||= M("h3", { class: "mb-2 text-sm font-semibold" }, "Presets", -1),
					as.value ? (h(), k("p", ir, w(as.value), 1)) : T("", !0),
					ns.value.length === 0 ? (h(), k("p", ar, "Save the form below as a preset to reuse it later.")) : (h(), k("div", or, [(h(!0), k(O, null, t(ns.value, (e) => (h(), k("div", {
						key: e.name,
						class: "flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
					}, [
						M("button", {
							type: "button",
							class: "cursor-pointer font-medium hover:text-primary",
							onClick: (t) => cs(e)
						}, w(e.name), 9, sr),
						M("span", cr, w(e.distro) + "/" + w(e.release), 1),
						M("button", {
							type: "button",
							class: "cursor-pointer text-muted-foreground hover:text-destructive",
							"aria-label": "Delete preset",
							onClick: (t) => ls(e.name)
						}, "✕", 8, lr)
					]))), 128))])),
					M("div", ur, [
						S(y(Q), {
							for: "new-preset-name",
							class: "sr-only"
						}, {
							default: g(() => [...a[53] ||= [E("Preset name", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "new-preset-name",
							modelValue: rs.value,
							"onUpdate:modelValue": a[1] ||= (e) => rs.value = e,
							placeholder: "Preset name",
							class: "w-56"
						}, null, 8, ["modelValue"]),
						S(y(A), {
							size: "sm",
							variant: "outline",
							disabled: is.value || !rs.value.trim(),
							onClick: ss
						}, {
							default: g(() => [E(w(is.value ? "Saving…" : "Save as preset"), 1)]),
							_: 1
						}, 8, ["disabled"])
					]),
					S(y($), null, {
						default: g(() => [...a[54] ||= [E(" Saves distro, release, and the current package/tool list — not the alias, since that should stay unique per build. Saving under a name that already exists overwrites it. ", -1)]]),
						_: 1
					}),
					M("div", dr, [
						M("div", fr, [a[55] ||= M("h3", { class: "text-sm font-semibold" }, "Saved images", -1), us.value.length > 0 ? (h(), C(y(A), {
							key: 0,
							size: "sm",
							variant: "outline",
							disabled: ys.value,
							onClick: xs
						}, {
							default: g(() => [E(w(ys.value ? "Checking…" : "Prune stale records"), 1)]),
							_: 1
						}, 8, ["disabled"])) : T("", !0)]),
						ds.value ? (h(), k("p", pr, w(ds.value), 1)) : T("", !0),
						bs.value ? (h(), k("p", mr, w(bs.value), 1)) : T("", !0),
						us.value.length === 0 ? (h(), k("p", hr, " No images built yet — the first one you build can become the golden master. ")) : (h(), k("div", gr, [(h(!0), k(O, null, t([...us.value].sort((e, t) => +!!t.isMaster - !!e.isMaster), (e) => (h(), k("div", {
							key: e.alias,
							class: _e(["flex items-center gap-3 rounded-md border px-3 py-2", e.isMaster ? "border-primary bg-primary/5" : "border-border"])
						}, [
							M("div", _r, [M("div", vr, [
								M("span", yr, w(e.alias), 1),
								e.isMaster ? (h(), C(y(ye), {
									key: 0,
									variant: "orange"
								}, {
									default: g(() => [...a[56] ||= [E("Golden master", -1)]]),
									_: 1
								})) : T("", !0),
								M("span", br, w(e.distro) + "/" + w(e.release), 1)
							]), M("p", xr, w(vs(e.packages)), 1)]),
							S(y(A), {
								size: "sm",
								variant: "outline",
								disabled: e.isMaster || fs.value === e.alias,
								onClick: (t) => ms(e),
								title: e.isMaster ? "Current launch default; choose another image to replace it" : "New containers launch from this image by default"
							}, {
								default: g(() => [E(w(e.isMaster ? "Default" : "Set as default"), 1)]),
								_: 2
							}, 1032, [
								"disabled",
								"onClick",
								"title"
							]),
							S(y(A), {
								size: "sm",
								variant: "secondary",
								onClick: (t) => hs(e)
							}, {
								default: g(() => [...a[57] ||= [E("Build variant", -1)]]),
								_: 1
							}, 8, ["onClick"]),
							S(y(A), {
								size: "sm",
								variant: "destructive",
								disabled: gs.value === e.alias,
								onClick: (t) => _s(e)
							}, {
								default: g(() => [...a[58] ||= [E("Delete", -1)]]),
								_: 1
							}, 8, ["disabled", "onClick"])
						], 2))), 128))])),
						S(y($), null, {
							default: g(() => [...a[59] ||= [E(" Only one image can be the golden master at a time — marking a new one unmarks the previous. Marking it also sets it as the default image new containers launch from (Config → Container Defaults), so this is more than a label. \"Build variant\" pre-fills the form from that image's distro/release/packages so you can edit, extend, or strip it down before building a new one. \"Prune stale records\" checks every saved image still actually exists in Incus and untracks any that don't — useful if one was deleted directly via the incus CLI instead of through here. ", -1)]]),
							_: 1
						})
					]),
					M("div", Sr, [M("button", {
						type: "button",
						"aria-expanded": Xt.value,
						"aria-controls": "config-import-panel",
						class: "flex w-full cursor-pointer items-center gap-1.5 text-left text-sm font-semibold",
						onClick: a[2] ||= (e) => Xt.value = !Xt.value
					}, [
						M("span", { class: _e(["text-muted-foreground transition-transform", Xt.value ? "rotate-90" : ""]) }, "▸", 2),
						a[60] ||= E(" Import from a config file ", -1),
						a[61] ||= M("span", { class: "font-normal text-xs text-muted-foreground" }, "devcontainer.json, mise.toml, .tool-versions", -1)
					], 8, Cr), Xt.value ? (h(), k("div", wr, [
						M("div", null, [
							a[66] ||= M("p", { class: "mb-2 text-xs text-muted-foreground" }, " devcontainer.json — maps the base image and recognized features to real packages; anything that isn't applicable to image building is reported, not silently dropped. ", -1),
							M("input", {
								ref_key: "devcontainerFileInput",
								ref: Ro,
								type: "file",
								accept: ".json,application/json",
								class: "hidden",
								onChange: Bo
							}, null, 544),
							S(y(A), {
								size: "sm",
								variant: "outline",
								onClick: zo
							}, {
								default: g(() => [...a[62] ||= [E("Choose devcontainer.json…", -1)]]),
								_: 1
							}),
							Io.value ? (h(), k("p", Tr, w(Io.value), 1)) : T("", !0),
							Lo.value ? (h(), k("div", Er, [
								Lo.value.distroSet ? (h(), k("p", Dr, [...a[63] ||= [
									E("Distro/release set from ", -1),
									M("span", { class: "font-mono" }, "image", -1),
									E(".", -1)
								]])) : T("", !0),
								Lo.value.packagesAdded.length > 0 ? (h(), k("p", Or, [a[64] ||= E(" Packages added: ", -1), M("span", kr, w(Lo.value.packagesAdded.join(", ")), 1)])) : T("", !0),
								Lo.value.commandsAdded.length > 0 ? (h(), k("p", Ar, w(Lo.value.commandsAdded.length) + " lifecycle command(s) added below — review before building. ", 1)) : T("", !0),
								Lo.value.skipped.length > 0 ? (h(), k("div", jr, [a[65] ||= M("p", { class: "text-muted-foreground" }, "Skipped (review manually):", -1), M("ul", Mr, [(h(!0), k(O, null, t(Lo.value.skipped, (e) => (h(), k("li", { key: e }, w(e), 1))), 128))])])) : T("", !0)
							])) : T("", !0)
						]),
						M("div", Nr, [
							a[71] ||= M("p", { class: "mb-2 text-xs text-muted-foreground" }, [
								E(" mise.toml / .tool-versions — pins exact tool versions by baking in "),
								M("span", { class: "font-mono" }, "mise"),
								E(" itself as a post-install step, wired system-wide so the container's actual runtime user can use the tools too. ")
							], -1),
							M("input", {
								ref_key: "miseTomlFileInput",
								ref: Yo,
								type: "file",
								accept: ".toml,application/toml",
								class: "hidden",
								onChange: a[3] ||= (e) => Zo(e, "toml")
							}, null, 544),
							M("input", {
								ref_key: "toolVersionsFileInput",
								ref: Xo,
								type: "file",
								accept: ".tool-versions,text/plain",
								class: "hidden",
								onChange: a[4] ||= (e) => Zo(e, "tool-versions")
							}, null, 544),
							M("div", Pr, [S(y(A), {
								size: "sm",
								variant: "outline",
								onClick: a[5] ||= (e) => Yo.value?.click()
							}, {
								default: g(() => [...a[67] ||= [E("Choose mise.toml…", -1)]]),
								_: 1
							}), S(y(A), {
								size: "sm",
								variant: "outline",
								onClick: a[6] ||= (e) => Xo.value?.click()
							}, {
								default: g(() => [...a[68] ||= [E("Choose .tool-versions…", -1)]]),
								_: 1
							})]),
							qo.value ? (h(), k("p", Fr, w(qo.value), 1)) : T("", !0),
							Jo.value ? (h(), k("p", Ir, [
								a[69] ||= E(" Tools pinned: ", -1),
								M("span", Lr, w(Jo.value.join(", ")), 1),
								a[70] ||= E(" — see the setup commands below. ", -1)
							])) : T("", !0)
						]),
						M("div", Rr, [
							S(y(Q), {
								for: "dotfiles-repo",
								class: "mb-1 block"
							}, {
								default: g(() => [...a[72] ||= [E("Bootstrap dotfiles from a repo", -1)]]),
								_: 1
							}),
							a[75] ||= M("p", { class: "mb-2 text-xs text-muted-foreground" }, [
								E(" Experimental — clones the repo and hands off to "),
								M("span", { class: "font-mono" }, "mise bootstrap"),
								E(", which only applies dotfiles if that repo's own mise config declares them. ")
							], -1),
							M("div", zr, [
								S(y(Z), {
									id: "dotfiles-repo",
									modelValue: Qo.value,
									"onUpdate:modelValue": a[7] ||= (e) => Qo.value = e,
									class: "w-72 font-mono",
									placeholder: "git@github.com:you/dotfiles.git"
								}, null, 8, ["modelValue"]),
								S(y(Z), {
									modelValue: $o.value,
									"onUpdate:modelValue": a[8] ||= (e) => $o.value = e,
									"aria-label": "Dotfiles branch or tag (optional)",
									class: "w-32 font-mono",
									placeholder: "branch (optional)"
								}, null, 8, ["modelValue"]),
								S(y(A), {
									size: "sm",
									variant: "outline",
									disabled: !Qo.value.trim(),
									onClick: es
								}, {
									default: g(() => [...a[73] ||= [E("Add bootstrap", -1)]]),
									_: 1
								}, 8, ["disabled"]),
								X.has("mise:dotfiles-clone") ? (h(), C(y(A), {
									key: 0,
									size: "sm",
									variant: "outline",
									onClick: ts
								}, {
									default: g(() => [...a[74] ||= [E("Remove", -1)]]),
									_: 1
								})) : T("", !0)
							])
						])
					])) : T("", !0)])
				])]), M("div", null, [a[94] ||= M("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Build", -1), M("div", Br, [
					a[93] ||= M("h3", { class: "mb-4 text-base font-semibold" }, "Build container image", -1),
					qt.value ? (h(), k("div", Vr, w(qt.value), 1)) : T("", !0),
					Yt.value ? (h(), k("div", Hr, [M("span", null, [a[78] ||= E("Building variant of: ", -1), M("span", Ur, w(Yt.value), 1)]), M("button", {
						type: "button",
						class: "ml-auto cursor-pointer text-muted-foreground hover:text-foreground",
						onClick: jo
					}, " ✕ Clear ")])) : T("", !0),
					M("div", Wr, [
						S(y(Q), { for: "builder-distro" }, {
							default: g(() => [...a[79] ||= [E("Distro", -1)]]),
							_: 1
						}),
						M("div", Gr, [S(y(pn), {
							id: "builder-distro",
							modelValue: K.value,
							"onUpdate:modelValue": a[9] ||= (e) => K.value = e,
							class: "w-48"
						}, {
							default: g(() => [(h(), k(O, null, t(It, (e) => M("option", {
								key: e.value,
								value: e.value
							}, w(e.label), 9, Kr)), 64)), M("option", { value: Eo }, "Other… (custom)")]),
							_: 1
						}, 8, ["modelValue"]), zt.value ? (h(), C(y(Z), {
							key: 0,
							id: "builder-custom-distro",
							"aria-label": "Custom distro",
							modelValue: Rt.value,
							"onUpdate:modelValue": a[10] ||= (e) => Rt.value = e,
							class: "w-40 font-mono",
							placeholder: "e.g. archlinux"
						}, null, 8, ["modelValue"])) : T("", !0)]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[80] ||= [E(" The curated list is verified against distrobuilder's own real image definitions — pick \"Other\" for anything else it supports; distrobuilder covers more than this list captures. ", -1)]]),
							_: 1
						}),
						S(y(Q), { for: "builder-release" }, {
							default: g(() => [...a[81] ||= [E("Release", -1)]]),
							_: 1
						}),
						M("div", qr, [S(y(pn), {
							id: "builder-release",
							modelValue: q.value,
							"onUpdate:modelValue": a[11] ||= (e) => q.value = e,
							class: "w-48"
						}, {
							default: g(() => [(h(!0), k(O, null, t(Ut.value, (e) => (h(), k("option", {
								key: e.value,
								value: e.value
							}, w(e.label), 9, Jr))), 128)), M("option", { value: Do }, "Other… (custom)")]),
							_: 1
						}, 8, ["modelValue"]), Bt.value ? (h(), C(y(Z), {
							key: 0,
							id: "builder-custom-release",
							"aria-label": "Custom release",
							modelValue: J.value,
							"onUpdate:modelValue": a[12] ||= (e) => J.value = e,
							class: "w-40 font-mono",
							placeholder: "e.g. rolling"
						}, null, 8, ["modelValue"])) : T("", !0)]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[82] ||= [E("Options change with the distro above — a custom distro always shows the free-text field here too.", -1)]]),
							_: 1
						}),
						S(y(Q), { for: "builder-alias" }, {
							default: g(() => [...a[83] ||= [E("Alias", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "builder-alias",
							modelValue: Gt.value,
							"onUpdate:modelValue": a[13] ||= (e) => Gt.value = e,
							class: "w-96 justify-self-end",
							placeholder: "my-custom-image"
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[84] ||= [E(" Becomes the image's name in Incus once the build succeeds — other containers (and \"build variant\") reference it by this alias, so it must be unique. Not required to match the container's own name. ", -1)]]),
							_: 1
						})
					]),
					M("div", Yr, [
						a[90] ||= M("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Packages & tools", -1),
						S(y(Q), {
							for: "package-search",
							class: "sr-only"
						}, {
							default: g(() => [...a[85] ||= [E("Search packages and tools", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "package-search",
							modelValue: $t.value,
							"onUpdate:modelValue": a[14] ||= (e) => $t.value = e,
							class: "w-full font-mono",
							placeholder: "Search apt, npm, PyPI, Homebrew…"
						}, null, 8, ["modelValue"]),
						S(y($), null, {
							default: g(() => [...a[86] ||= [E(" apt only searches when Debian or Ubuntu is selected above. npm and PyPI results aren't OS packages — adding one adds a setup command that runs after packages install, and auto-adds the Node.js or Python packages it needs. Homebrew results show for browsing but can't be added yet — there's no way to bootstrap Homebrew itself inside an image build. ", -1)]]),
							_: 1
						}),
						rn.value ? (h(), k("p", Xr, w(rn.value), 1)) : T("", !0),
						tn.value.length > 0 ? (h(), k("p", Zr, [a[87] ||= E(" Some sources are unavailable right now, showing results from the rest: ", -1), (h(!0), k(O, null, t(tn.value, (e, t) => (h(), k("span", { key: e.ecosystem }, [E(w(t > 0 ? ", " : " "), 1), M("strong", null, w(cn[e.ecosystem]), 1)]))), 128))])) : T("", !0),
						nn.value ? (h(), k("p", Qr, "Searching…")) : en.value.length > 0 ? (h(), k("div", $r, [(h(!0), k(O, null, t(en.value, (e) => (h(), k("div", {
							key: `${e.ecosystem}:${e.name}`,
							class: "flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
						}, [
							M("span", { class: _e(["shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase", e.ecosystem === "apt" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"]) }, w(cn[e.ecosystem]), 3),
							M("div", ei, [
								M("span", ti, w(e.name), 1),
								e.version ? (h(), k("span", ni, w(e.version), 1)) : T("", !0),
								e.description ? (h(), k("p", ri, w(e.description), 1)) : T("", !0)
							]),
							e.ecosystem === "brew" ? (h(), k("span", ii, "not build-time yet")) : (h(), C(y(A), {
								key: 0,
								size: "sm",
								variant: "outline",
								disabled: ko(e),
								onClick: (t) => kn(e)
							}, {
								default: g(() => [E(w(ko(e) ? "Added" : "+ Add"), 1)]),
								_: 2
							}, 1032, ["disabled", "onClick"]))
						]))), 128))])) : $t.value.trim().length >= 2 ? (h(), k("p", ai, "No matches.")) : T("", !0),
						Y.size > 0 ? (h(), k("div", oi, [a[88] ||= M("p", { class: "mb-1.5 block text-xs font-medium" }, "Added from apt search", -1), M("div", si, [(h(!0), k(O, null, t(Y, (e) => (h(), k("span", {
							key: e,
							class: "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs"
						}, [E(w(e) + " ", 1), M("button", {
							type: "button",
							"aria-label": `Remove apt package ${e}`,
							class: "cursor-pointer text-muted-foreground hover:text-destructive",
							onClick: (t) => fn(e)
						}, "✕", 8, ci)]))), 128))])])) : T("", !0),
						X.size > 0 ? (h(), k("div", li, [a[89] ||= M("p", { class: "mb-1.5 block text-xs font-medium" }, "Extra setup commands (run after packages install)", -1), M("div", ui, [(h(!0), k(O, null, t(X, ([e, t]) => (h(), k("div", {
							key: e,
							class: "flex items-center gap-2 rounded-md border border-border px-2 py-1 font-mono text-xs"
						}, [M("span", di, w(t), 1), M("button", {
							type: "button",
							"aria-label": `Remove setup command ${e}`,
							class: "cursor-pointer text-muted-foreground hover:text-destructive",
							onClick: (t) => _n(e)
						}, "✕", 8, fi)]))), 128))])])) : T("", !0)
					]),
					M("div", pi, [
						S(y(Q), {
							for: "builder-extra-packages",
							class: "mb-1.5 block text-xs text-muted-foreground"
						}, {
							default: g(() => [...a[91] ||= [E("Anything else? (one per line, or comma-separated)", -1)]]),
							_: 1
						}),
						o(M("textarea", {
							id: "builder-extra-packages",
							"onUpdate:modelValue": a[15] ||= (e) => Wt.value = e,
							rows: "2",
							class: "border-input bg-background w-full rounded-md border px-3 py-2 text-sm font-mono",
							placeholder: "e.g. htop"
						}, null, 512), [[_t, Wt.value]]),
						S(y($), null, {
							default: g(() => [...a[92] ||= [E(" Exact OS package names for the selected distro's package manager — merged with anything added from search above, duplicates removed. Use this for anything search didn't turn up. ", -1)]]),
							_: 1
						})
					]),
					M("div", mi, [S(y(A), {
						disabled: Kt.value,
						onClick: ws
					}, {
						default: g(() => [E(w(Kt.value ? "Starting…" : "Build"), 1)]),
						_: 1
					}, 8, ["disabled"])])
				])])]),
				a[98] ||= M("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Results", -1),
				M("div", hi, [
					a[97] ||= M("h3", { class: "mb-4 text-base font-semibold" }, "Builds", -1),
					S(y($), null, {
						default: g(() => [...a[95] ||= [E(" Live distrobuilder log output, streamed while a build runs. This list is client-side only and resets on page reload — successful builds still land in Saved images above, but the log history itself isn't persisted. ", -1)]]),
						_: 1
					}),
					Jt.value.length === 0 ? (h(), k("div", gi, [...a[96] ||= [M("span", { class: "h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-700" }, null, -1), M("span", { class: "font-mono text-[11px] text-neutral-500" }, [E(" Pick a distro and release above, then hit Build — progress and logs stream in here."), M("span", { class: "motion-safe:animate-pulse" }, "_")], -1)]])) : (h(), k("div", _i, [(h(!0), k(O, null, t(Jt.value, (e) => (h(), k("div", {
						key: e.buildId,
						class: "rounded-md border border-border p-3"
					}, [
						M("div", vi, [M("div", yi, [M("span", bi, w(e.alias), 1), M("span", xi, w(e.distro) + " / " + w(e.release), 1)]), S(y(ye), { variant: Ts(e.status?.status) }, {
							default: g(() => [E(w(e.status?.status ?? "queued"), 1)]),
							_: 2
						}, 1032, ["variant"])]),
						e.status?.error || e.error ? (h(), k("div", Si, w(e.status?.error || e.error), 1)) : T("", !0),
						M("div", Ci, [M("span", { class: _e(["h-1.5 w-1.5 shrink-0 rounded-full", {
							"bg-emerald-500": e.status?.status === "success",
							"bg-red-500": e.status?.status === "failed",
							"bg-amber-500": e.status?.status === "running" || !e.status
						}]) }, null, 2), M("span", wi, "distrobuilder · " + w(e.buildId.slice(0, 8)), 1)]),
						M("pre", Ti, w(e.status?.logTail || "Waiting for log output…"), 1)
					]))), 128))]))
				])
			])) : r.value === "jails" ? (h(), k("section", Ei, [
				a[151] ||= M("p", { class: "mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Dashboard", -1),
				M("div", Di, [
					M("div", Oi, [a[99] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Total Containers", -1), M("p", ki, w(d.value.length), 1)]),
					M("div", Ai, [a[100] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Running", -1), M("p", ji, w(y(ae).length), 1)]),
					M("div", Mi, [a[101] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Stopped", -1), M("p", Ni, w(y(oe)), 1)]),
					M("div", Pi, [a[102] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Daemon", -1), M("div", Fi, [S(y(ye), { variant: u.value ? "green" : "red" }, {
						default: g(() => [E(w(u.value ? "Reachable" : "Not running"), 1)]),
						_: 1
					}, 8, ["variant"])])]),
					M("div", Ii, [a[103] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Memory In Use", -1), M("p", Li, w(y(de)(y(se))), 1)]),
					M("div", Ri, [
						a[104] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Total CPU (live)", -1),
						M("p", zi, w(y(Se)()), 1),
						y(le).length >= 2 ? (h(), k("svg", Bi, [M("polyline", {
							points: y(Ce)(y(le), "cpuPct"),
							fill: "none",
							stroke: "currentColor",
							"stroke-width": "1.5"
						}, null, 8, Vi)])) : T("", !0),
						a[105] ||= M("p", { class: "mt-0.5 text-[10px] text-muted-foreground" }, "last ~2 min, sum of running containers", -1)
					])
				]),
				S(y($), { class: "mb-6" }, {
					default: g(() => [...a[106] ||= [E(" CPU shown here is a live rate (% of one core), computed from the change in cumulative CPU time between polls every 5 seconds — not the raw counter Incus reports, which only ever goes up. The sparkline is a rolling client-side window that resets on page reload; nothing is persisted server-side. ", -1)]]),
					_: 1
				}),
				M("div", Hi, [M("div", Ui, [
					a[112] ||= M("h3", { class: "mb-1 text-base font-semibold" }, "Network & ACL", -1),
					a[113] ||= M("p", { class: "mb-3 text-xs text-muted-foreground" }, " The policy currently configured for every container on this bridge (from saved config, not a live probe). ", -1),
					M("div", Wi, [
						M("div", null, [a[107] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Bridge", -1), M("p", Gi, w(x.jailBridge || "—"), 1)]),
						M("div", null, [a[108] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Subnet", -1), M("p", Ki, w(x.jailSubnet || "—"), 1)]),
						M("div", null, [a[109] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "ACL Name", -1), M("p", qi, w(x.aclName || "—"), 1)]),
						M("div", null, [a[110] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Blocked Ranges", -1), M("p", Ji, w(ut()) + " blocked", 1)]),
						M("div", null, [a[111] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Default Egress / Ingress", -1), M("p", Yi, w(x.aclDefaultEgress) + " / " + w(x.aclDefaultIngress), 1)])
					])
				]), M("div", Xi, [
					a[119] ||= M("h3", { class: "mb-1 text-base font-semibold" }, "Launch Container", -1),
					a[120] ||= M("p", { class: "mb-3 text-xs text-muted-foreground" }, " Applies the Container Defaults profile — no build step. Each container gets its own independent root filesystem and workspace even when launched from the same image. ", -1),
					M("div", Zi, [
						M("div", Qi, [S(y(Q), {
							for: "new-container-name",
							class: "mb-2 block"
						}, {
							default: g(() => [...a[114] ||= [E("Container name", -1)]]),
							_: 1
						}), S(y(Z), {
							id: "new-container-name",
							modelValue: p.value,
							"onUpdate:modelValue": a[16] ||= (e) => p.value = e,
							placeholder: "new-container-name",
							class: "w-full font-mono"
						}, null, 8, ["modelValue"])]),
						M("div", $i, [S(y(Q), {
							for: "launch-image",
							class: "mb-2 block"
						}, {
							default: g(() => [...a[115] ||= [E("Image", -1)]]),
							_: 1
						}), S(y(pn), {
							id: "launch-image",
							modelValue: b.value,
							"onUpdate:modelValue": a[17] ||= (e) => b.value = e,
							class: "w-full"
						}, {
							default: g(() => [M("option", ea, "Default (" + w(x.jailImage || "—") + ")", 1), (h(!0), k(O, null, t(us.value, (e) => (h(), k("option", {
								key: e.alias,
								value: e.alias
							}, w(e.alias) + w(e.isMaster ? " (golden master)" : "") + " — " + w(e.distro) + "/" + w(e.release), 9, ta))), 128))]),
							_: 1
						}, 8, ["modelValue"])]),
						S(y(A), {
							size: "sm",
							variant: "secondary",
							disabled: !!_.value,
							onClick: I
						}, {
							default: g(() => [...a[116] ||= [E("Launch", -1)]]),
							_: 1
						}, 8, ["disabled"])
					]),
					p.value && _.value ? (h(), k("p", na, w(_.value), 1)) : T("", !0),
					M("div", ra, [S(y(sn), {
						id: "launch-allow-sudo",
						modelValue: re.value,
						"onUpdate:modelValue": a[18] ||= (e) => re.value = e
					}, null, 8, ["modelValue"]), a[117] ||= M("label", {
						for: "launch-allow-sudo",
						class: "cursor-pointer text-xs"
					}, " Allow sudo (NOPASSWD) for the agent user ", -1)]),
					S(y($), null, {
						default: g(() => [...a[118] ||= [E(" \"Default\" launches from Config → Container Defaults' image (the golden master, if one is set). Picking a specific image here launches from that image instead, just for this container — it doesn't change the default. Every launch, from any image, gets its own independent root filesystem; nothing is shared between containers built from the same source image. Sudo is off by default on purpose — the agent user having no path to root is what keeps a compromised dependency from escalating inside the container. Turning it on trades that away for convenience; you can also grant or check it later, per-container, from its Details panel. ", -1)]]),
						_: 1
					})
				])]),
				M("div", ia, [
					M("div", aa, [a[121] ||= M("h3", { class: "text-base font-semibold" }, "Containers", -1), y(oe) > 0 ? (h(), C(y(A), {
						key: 0,
						size: "sm",
						variant: "outline",
						disabled: Pe.value,
						onClick: Fe
					}, {
						default: g(() => [E(w(Pe.value ? "Deleting…" : `Delete ${y(oe)} stopped`), 1)]),
						_: 1
					}, 8, ["disabled"])) : T("", !0)]),
					S(y($), null, {
						default: g(() => [...a[122] ||= [E(" \"On bridge\" means this container's address falls inside the configured subnet — a real check, not a claim that the LAN-ban ACL is actively enforced for it specifically (that's a daemon-level policy on the whole bridge, shown above under Network & ACL). Each row's mini charts are the same rolling client-side window as the summary cards above. ", -1)]]),
						_: 1
					}),
					d.value.length === 0 ? (h(), k("p", oa, " No containers yet — launch one above to get started. ")) : (h(), k(O, { key: 1 }, [M("p", sa, " Total: " + w(y(ae).length) + " container" + w(y(ae).length === 1 ? "" : "s") + " running, " + w(y(de)(y(se))) + " memory, CPU time " + w(y(ue)(Number(y(ce)))), 1), M("div", ca, [(h(!0), k(O, null, t(d.value, (e) => (h(), k("div", {
						key: e.name,
						class: _e(["rounded-lg border border-border p-3", y(R) === e.name ? "border-primary/50" : "border-border"])
					}, [
						M("div", la, [M("div", ua, [
							M("span", da, w(e.name), 1),
							At(e) ? (h(), k("span", fa, "on bridge")) : T("", !0),
							S(y(ye), { variant: ct(e.status) }, {
								default: g(() => [E(w(e.status), 1)]),
								_: 2
							}, 1032, ["variant"])
						]), M("span", pa, w(e.ipv4 || "—"), 1)]),
						M("div", ma, [M("div", null, [M("p", {
							class: "text-[10px] font-semibold tracking-[0.06em] uppercase text-muted-foreground",
							title: `Live rate, % ${y(be)()}`
						}, "CPU", 8, ha), M("div", ga, [
							M("div", _a, [y(ve)(e) === null ? T("", !0) : (h(), k("div", {
								key: 0,
								class: "h-full rounded-full bg-primary",
								style: Oe({ width: y(ve)(e) + "%" })
							}, null, 4))]),
							M("span", va, w(y(ge)(e)), 1),
							y(xe)(e.name).length >= 2 ? (h(), k("svg", ya, [M("polyline", {
								points: y(Ce)(y(xe)(e.name), "cpuPct"),
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "1.5"
							}, null, 8, ba)])) : T("", !0)
						])]), M("div", null, [
							a[123] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.06em] uppercase text-muted-foreground" }, "Memory", -1),
							M("div", xa, [M("span", Sa, w(y(pe)(e)), 1), y(xe)(e.name).length >= 2 ? (h(), k("svg", Ca, [M("polyline", {
								points: y(Ce)(y(xe)(e.name), "memPct"),
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "1.5"
							}, null, 8, wa)])) : T("", !0)]),
							y(me)(e) === null ? T("", !0) : (h(), k("div", Ta, [M("div", {
								class: "h-full rounded-full bg-primary",
								style: Oe({ width: y(me)(e) + "%" })
							}, null, 4)]))
						])]),
						M("div", Ea, [
							S(y(A), {
								size: "sm",
								variant: "outline",
								onClick: (t) => Me(e.name, "start")
							}, {
								default: g(() => [...a[124] ||= [E("Start", -1)]]),
								_: 1
							}, 8, ["onClick"]),
							S(y(A), {
								size: "sm",
								variant: "outline",
								onClick: (t) => Me(e.name, "stop")
							}, {
								default: g(() => [...a[125] ||= [E("Stop", -1)]]),
								_: 1
							}, 8, ["onClick"]),
							S(y(A), {
								size: "sm",
								variant: "secondary",
								disabled: e.status.toLowerCase() !== "running",
								onClick: (t) => ie.value = e.name
							}, {
								default: g(() => [...a[126] ||= [E("Console", -1)]]),
								_: 1
							}, 8, ["disabled", "onClick"]),
							S(y(A), {
								size: "sm",
								variant: "outline",
								onClick: (t) => y(Be)(e.name)
							}, {
								default: g(() => [E(w(y(R) === e.name ? "Hide manage" : "Manage"), 1)]),
								_: 2
							}, 1032, ["onClick"]),
							S(y(A), {
								size: "sm",
								variant: "destructive",
								onClick: (t) => Ne(e.name)
							}, {
								default: g(() => [...a[127] ||= [E("Delete", -1)]]),
								_: 1
							}, 8, ["onClick"])
						]),
						y(R) === e.name ? (h(), k("div", Da, [y(Ie) ? (h(), k("p", Oa, "Loading…")) : y(z) ? (h(), k(O, { key: 1 }, [
							M("div", ka, [
								M("div", null, [a[128] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Image", -1), M("p", Aa, w(y(z).imageOs || "—") + " " + w(y(z).imageRelease || ""), 1)]),
								M("div", null, [a[129] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Profiles", -1), M("p", ja, w(y(z).profiles.join(", ")), 1)]),
								M("div", null, [a[130] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Storage pool", -1), M("p", Ma, w(y(z).storagePool || "—"), 1)]),
								M("div", null, [a[131] ||= M("p", { class: "text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Bridge", -1), M("p", Na, w(y(z).networkBridge || "—"), 1)])
							]),
							M("div", Pa, [M("div", Fa, [
								M("div", null, [S(y(Q), {
									for: "detail-cpu-limit",
									class: "mb-1 flex items-center gap-1.5 text-xs"
								}, {
									default: g(() => [a[133] ||= E(" CPU limit ", -1), y(z).cpuLimitIsOverride ? (h(), C(y(ye), {
										key: 0,
										variant: "orange"
									}, {
										default: g(() => [...a[132] ||= [E("override", -1)]]),
										_: 1
									})) : T("", !0)]),
									_: 1
								}), M("div", Ia, [S(y(Z), {
									id: "detail-cpu-limit",
									modelValue: y(Le),
									"onUpdate:modelValue": a[19] ||= (e) => l(Le) ? Le.value = e : null,
									class: "w-24 font-mono",
									placeholder: "e.g. 2"
								}, null, 8, ["modelValue"]), S(y(A), {
									size: "sm",
									variant: "outline",
									disabled: L.value,
									onClick: Ve
								}, {
									default: g(() => [...a[134] ||= [E("Apply", -1)]]),
									_: 1
								}, 8, ["disabled"])])]),
								M("div", null, [S(y(Q), {
									for: "detail-memory-limit",
									class: "mb-1 flex items-center gap-1.5 text-xs"
								}, {
									default: g(() => [a[136] ||= E(" Memory limit ", -1), y(z).memoryLimitIsOverride ? (h(), C(y(ye), {
										key: 0,
										variant: "orange"
									}, {
										default: g(() => [...a[135] ||= [E("override", -1)]]),
										_: 1
									})) : T("", !0)]),
									_: 1
								}), M("div", La, [S(y(Z), {
									id: "detail-memory-limit",
									modelValue: y(Re),
									"onUpdate:modelValue": a[20] ||= (e) => l(Re) ? Re.value = e : null,
									class: "w-24 font-mono",
									placeholder: "e.g. 4GiB"
								}, null, 8, ["modelValue"]), S(y(A), {
									size: "sm",
									variant: "outline",
									disabled: L.value,
									onClick: He
								}, {
									default: g(() => [...a[137] ||= [E("Apply", -1)]]),
									_: 1
								}, 8, ["disabled"])])]),
								y(z).cpuLimitIsOverride || y(z).memoryLimitIsOverride ? (h(), C(y(A), {
									key: 0,
									size: "sm",
									variant: "outline",
									disabled: L.value,
									onClick: Ue
								}, {
									default: g(() => [...a[138] ||= [E("Use profile default", -1)]]),
									_: 1
								}, 8, ["disabled"])) : T("", !0)
							]), M("div", null, [S(y(Q), {
								for: "detail-workspace",
								class: "mb-1 flex items-center gap-1.5 text-xs"
							}, {
								default: g(() => [a[140] ||= E(" Workspace host path (/workspace) ", -1), y(z).workspaceIsOverride ? (h(), C(y(ye), {
									key: 0,
									variant: "orange"
								}, {
									default: g(() => [...a[139] ||= [E("override", -1)]]),
									_: 1
								})) : T("", !0)]),
								_: 1
							}), M("div", Ra, [
								S(y(Z), {
									id: "detail-workspace",
									modelValue: y(ze),
									"onUpdate:modelValue": a[21] ||= (e) => l(ze) ? ze.value = e : null,
									class: "flex-1 font-mono"
								}, null, 8, ["modelValue"]),
								S(y(A), {
									size: "sm",
									variant: "outline",
									disabled: L.value,
									onClick: We
								}, {
									default: g(() => [...a[141] ||= [E("Apply", -1)]]),
									_: 1
								}, 8, ["disabled"]),
								y(z).workspaceIsOverride ? (h(), C(y(A), {
									key: 0,
									size: "sm",
									variant: "outline",
									disabled: L.value,
									onClick: Ge
								}, {
									default: g(() => [...a[142] ||= [E("Use profile default", -1)]]),
									_: 1
								}, 8, ["disabled"])) : T("", !0)
							])])]),
							Ke(y(z)) ? (h(), k("div", za, [a[143] ||= M("span", null, [
								E(" This container shares "),
								M("span", { class: "font-mono" }, "/workspace"),
								E(" with every other container still on the profile's default — file writes are live-visible between them. ")
							], -1), S(y(A), {
								size: "sm",
								variant: "outline",
								disabled: qe.value,
								onClick: Je
							}, {
								default: g(() => [E(w(qe.value ? "Isolating…" : "Isolate this container's workspace"), 1)]),
								_: 1
							}, 8, ["disabled"])])) : T("", !0),
							y(B) ? (h(), k("p", Ba, w(y(B)), 1)) : T("", !0),
							S(y($), null, {
								default: g(() => [...a[144] ||= [E(" Values without an \"override\" badge are inherited straight from the container's profile and apply to every container using it. Applying here overrides just this one instance — it won't touch the profile or any other container. Memory limit changes need a restart of this container to actually take effect on a running instance (verified: clearing an override alone doesn't shrink an already-larger live cgroup limit back down). Isolating a shared workspace points it at a new, empty per-container directory — it does not copy any files already sitting in the old shared one. ", -1)]]),
								_: 1
							}),
							M("div", Va, [
								M("p", Ha, [a[145] ||= E(" Sudo (agent user) ", -1), S(y(ye), { variant: y(z).sudoEnabled ? "green" : "gray" }, {
									default: g(() => [E(w(y(z).sudoEnabled ? "enabled" : "disabled"), 1)]),
									_: 1
								}, 8, ["variant"])]),
								y(z).sudoEnabled ? T("", !0) : (h(), C(y(A), {
									key: 0,
									size: "sm",
									variant: "outline",
									disabled: tt.value,
									onClick: nt
								}, {
									default: g(() => [E(w(tt.value ? "Granting…" : "Grant sudo (NOPASSWD)"), 1)]),
									_: 1
								}, 8, ["disabled"])),
								S(y($), null, {
									default: g(() => [...a[146] ||= [
										E(" Off by default on purpose — this is what keeps a compromised dependency from escalating to root inside the container. Granting sudo here applies immediately to the running container and can't be un-granted from this panel (remove ", -1),
										M("span", { class: "font-mono" }, "/etc/sudoers.d/agent", -1),
										E(" manually, or via the privileged command box below, if you need to revoke it). ", -1)
									]]),
									_: 1
								})
							]),
							M("div", Ua, [
								S(y(Q), {
									for: "homebrew-formula",
									class: "mb-1 block text-xs"
								}, {
									default: g(() => [...a[147] ||= [E("Install a package (Homebrew)", -1)]]),
									_: 1
								}),
								M("div", Wa, [S(y(Z), {
									id: "homebrew-formula",
									modelValue: H.value,
									"onUpdate:modelValue": a[22] ||= (e) => H.value = e,
									class: "w-48 font-mono",
									placeholder: "e.g. wget",
									onKeydown: Nt(jt(et, ["prevent"]), ["enter"])
								}, null, 8, ["modelValue", "onKeydown"]), S(y(A), {
									size: "sm",
									variant: "outline",
									disabled: !H.value.trim() || Ye.value,
									onClick: et
								}, {
									default: g(() => [E(w(Ye.value ? "Installing…" : "Install"), 1)]),
									_: 1
								}, 8, ["disabled"])]),
								Xe.value ? (h(), k("p", Ga, w(Xe.value), 1)) : T("", !0),
								Ze.value ? (h(), k("p", Ka, w(Ze.value), 1)) : T("", !0),
								S(y($), null, {
									default: g(() => [...a[148] ||= [
										E(" Best-effort: bootstraps Homebrew itself under this container's non-root \"agent\" user if it isn't already present (needs bash and git inside the container), installing to ", -1),
										M("span", { class: "font-mono" }, "~/.linuxbrew", -1),
										E(" rather than Homebrew's usual shared system path — the official installer needs ", -1),
										M("span", { class: "font-mono" }, "sudo", -1),
										E(" for that path, and \"agent\" deliberately has none inside these containers. This runs against the LIVE container over exec — it isn't baked into the image, so a rebuilt or replacement container won't have it. ", -1)
									]]),
									_: 1
								})
							]),
							M("div", qa, [
								S(y(Q), {
									for: "privileged-command",
									class: "mb-1 block text-xs"
								}, {
									default: g(() => [...a[149] ||= [E("Run a privileged command", -1)]]),
									_: 1
								}),
								M("div", Ja, [S(y(Z), {
									id: "privileged-command",
									modelValue: rt.value,
									"onUpdate:modelValue": a[23] ||= (e) => rt.value = e,
									class: "flex-1 font-mono",
									placeholder: "e.g. apt-get install -y htop",
									onKeydown: Nt(jt(st, ["prevent"]), ["enter"])
								}, null, 8, ["modelValue", "onKeydown"]), S(y(A), {
									size: "sm",
									variant: "outline",
									disabled: !rt.value.trim() || it.value,
									onClick: st
								}, {
									default: g(() => [E(w(it.value ? "Running…" : "Run"), 1)]),
									_: 1
								}, 8, ["disabled"])]),
								U.value ? (h(), k("div", Ya, [M("p", { class: _e(["text-xs", U.value.status === "success" ? "text-unraid-green-800" : "text-destructive"]) }, w(U.value.message), 3), U.value.stdout || U.value.stderr ? (h(), k("pre", Xa, w([U.value.stdout, U.value.stderr].filter(Boolean).join("\n")), 1)) : T("", !0)])) : T("", !0),
								S(y($), null, {
									default: g(() => [...a[150] ||= [E(" Runs as root, mediated by you here in the UI — the container's own \"agent\" user never gets this capability, so this stays safe even with sudo left off. Good for one-off fixes (a forgotten package) without needing the sudo toggle at all. ", -1)]]),
									_: 1
								})
							])
						], 64)) : T("", !0)])) : T("", !0)
					], 2))), 128))])], 64))
				])
			])) : r.value === "config" ? (h(), k("section", Za, [M("div", Qa, [
				M("section", $a, [
					a[166] ||= M("p", { class: "mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Runtime", -1),
					a[167] ||= M("h3", { class: "mb-4 text-base font-semibold" }, "Service", -1),
					M("div", eo, [
						S(y(Q), { for: "config-enabled" }, {
							default: g(() => [...a[152] ||= [E("Enable Incus", -1)]]),
							_: 1
						}),
						S(y(sn), {
							id: "config-enabled",
							modelValue: x.enabled,
							"onUpdate:modelValue": a[24] ||= (e) => x.enabled = e
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[153] ||= [
								E(" Starts incusd on array start. Leaving this off keeps the daemon — and its private-prefixed binaries under ", -1),
								M("span", { class: "font-mono" }, "/usr/local/incus/", -1),
								E(" — installed but never running. ", -1)
							]]),
							_: 1
						}),
						S(y(Q), { for: "config-dashboard-widget" }, {
							default: g(() => [...a[154] ||= [E("Show Dashboard widget", -1)]]),
							_: 1
						}),
						S(y(sn), {
							id: "config-dashboard-widget",
							modelValue: x.dashboardWidgetEnable,
							"onUpdate:modelValue": a[25] ||= (e) => x.dashboardWidgetEnable = e
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[155] ||= [E(" Shows a jail-status box (running/stopped/other counts) on Unraid's Main/Dashboard tab. ", -1)]]),
							_: 1
						}),
						S(y(Q), { for: "config-state-dir" }, {
							default: g(() => [...a[156] ||= [E("Incus state directory", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-state-dir",
							modelValue: x.stateDir,
							"onUpdate:modelValue": a[26] ||= (e) => x.stateDir = e,
							class: "w-96 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[157] ||= [E(" Where incusd keeps its database, storage pool, and container state. Must be real persistent storage on the array, not tmpfs — this is the one thing that survives a reboot or plugin update. ", -1)]]),
							_: 1
						})
					]),
					M("div", to, [a[165] ||= M("h4", { class: "mb-3 text-sm font-semibold" }, "Storage pool", -1), M("div", no, [
						S(y(Q), { for: "config-storage-driver" }, {
							default: g(() => [...a[158] ||= [E("Storage driver", -1)]]),
							_: 1
						}),
						S(y(pn), {
							id: "config-storage-driver",
							modelValue: x.storageDriver,
							"onUpdate:modelValue": a[27] ||= (e) => x.storageDriver = e,
							class: "w-56 justify-self-end"
						}, {
							default: g(() => [...a[159] ||= [M("option", { value: "dir" }, "dir (simple, no pool required)", -1), M("option", { value: "zfs" }, "zfs (snapshots/speed, needs existing pool)", -1)]]),
							_: 1
						}, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[160] ||= [
								M("span", { class: "font-mono" }, "dir", -1),
								E(" needs no existing pool and always works — it's the default for exactly that reason. ", -1),
								M("span", { class: "font-mono" }, "zfs", -1),
								E(" gets snapshots and speed, but the pool or dataset must already exist on your system; there's no safe way to auto-create one on your array. ", -1)
							]]),
							_: 1
						}),
						we.value ? (h(), k(O, { key: 0 }, [
							S(y(Q), { for: "config-storage-source" }, {
								default: g(() => [...a[161] ||= [E("ZFS pool/dataset", -1)]]),
								_: 1
							}),
							S(y(Z), {
								id: "config-storage-source",
								modelValue: x.storageSource,
								"onUpdate:modelValue": a[28] ||= (e) => x.storageSource = e,
								class: "w-96 justify-self-end font-mono"
							}, null, 8, ["modelValue"]),
							S(y($), { class: "col-span-2" }, {
								default: g(() => [...a[162] ||= [
									E(" An existing pool or dataset path, e.g. ", -1),
									M("span", { class: "font-mono" }, "nvme/incus", -1),
									E(". A dataset under this path is created if missing, but the pool itself must already exist. ", -1)
								]]),
								_: 1
							})
						], 64)) : T("", !0),
						S(y(Q), { for: "config-storage-pool" }, {
							default: g(() => [...a[163] ||= [E("Incus storage pool name", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-storage-pool",
							modelValue: x.storagePoolName,
							"onUpdate:modelValue": a[29] ||= (e) => x.storagePoolName = e,
							class: "w-48 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[164] ||= [E(" The name Incus itself uses for this storage pool internally — cosmetic, doesn't need to match anything else on the host. ", -1)]]),
							_: 1
						})
					])])
				]),
				M("section", ro, [
					a[193] ||= M("p", { class: "mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Network & Access", -1),
					a[194] ||= M("h3", { class: "mb-4 text-base font-semibold" }, "Network & ACL (LAN-ban)", -1),
					a[195] ||= M("p", { class: "mb-4 text-xs text-muted-foreground" }, " Controls the bridge/subnet containers attach to and the firewall rules governing what they can reach. ", -1),
					M("div", io, [
						S(y(Q), { for: "config-bridge" }, {
							default: g(() => [...a[168] ||= [E("Container bridge", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-bridge",
							modelValue: x.jailBridge,
							"onUpdate:modelValue": a[30] ||= (e) => x.jailBridge = e,
							class: "w-48 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[169] ||= [E(" A dedicated NAT bridge name for containers, kept separate from Unraid's own br0 so container traffic never touches host networking directly. ", -1)]]),
							_: 1
						}),
						S(y(Q), { for: "config-subnet" }, {
							default: g(() => [...a[170] ||= [E("Container subnet", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-subnet",
							modelValue: x.jailSubnet,
							"onUpdate:modelValue": a[31] ||= (e) => x.jailSubnet = e,
							class: "w-48 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[171] ||= [E(" CIDR for the bridge. Defaults to an RFC 2544 benchmark range specifically because it won't collide with a typical home or office LAN. ", -1)]]),
							_: 1
						}),
						S(y(Q), { for: "config-nat" }, {
							default: g(() => [...a[172] ||= [E("NAT", -1)]]),
							_: 1
						}),
						S(y(sn), {
							id: "config-nat",
							modelValue: x.jailNat,
							"onUpdate:modelValue": a[32] ||= (e) => x.jailNat = e
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[173] ||= [E(" Routes container traffic to the Internet through the host. Turning this off isolates containers with no outbound access at all — no Internet, no LAN. ", -1)]]),
							_: 1
						}),
						S(y(Q), { for: "config-ipv6" }, {
							default: g(() => [...a[174] ||= [E("IPv6", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-ipv6",
							"model-value": "none",
							disabled: "",
							readonly: "",
							"aria-describedby": "config-ipv6-policy",
							class: "w-48 justify-self-end font-mono"
						}),
						S(y($), {
							id: "config-ipv6-policy",
							class: "col-span-2"
						}, {
							default: g(() => [...a[175] ||= [
								E(" Fixed to ", -1),
								M("span", { class: "font-mono" }, "none", -1),
								E(": IPv6 is deliberately fail-closed until the plugin can enforce isolation equivalent to the IPv4 ACL policy. Containers cannot enable it from this page. ", -1)
							]]),
							_: 1
						}),
						S(y(Q), { for: "config-acl-name" }, {
							default: g(() => [...a[176] ||= [E("ACL name", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-acl-name",
							modelValue: x.aclName,
							"onUpdate:modelValue": a[33] ||= (e) => x.aclName = e,
							class: "w-48 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[177] ||= [E(" The name of the Incus network ACL that enforces the LAN ban — created and applied to the bridge by the array-start init script. ", -1)]]),
							_: 1
						}),
						S(y(Q), { for: "config-egress" }, {
							default: g(() => [...a[178] ||= [E("Default egress action", -1)]]),
							_: 1
						}),
						S(y(pn), {
							id: "config-egress",
							modelValue: x.aclDefaultEgress,
							"onUpdate:modelValue": a[34] ||= (e) => x.aclDefaultEgress = e,
							class: "w-32 justify-self-end"
						}, {
							default: g(() => [...a[179] ||= [M("option", { value: "allow" }, "allow", -1), M("option", { value: "drop" }, "drop", -1)]]),
							_: 1
						}, 8, ["modelValue"]),
						S(y(Q), { for: "config-ingress" }, {
							default: g(() => [...a[180] ||= [E("Default ingress action", -1)]]),
							_: 1
						}),
						S(y(pn), {
							id: "config-ingress",
							modelValue: x.aclDefaultIngress,
							"onUpdate:modelValue": a[35] ||= (e) => x.aclDefaultIngress = e,
							class: "w-32 justify-self-end"
						}, {
							default: g(() => [...a[181] ||= [M("option", { value: "allow" }, "allow", -1), M("option", { value: "drop" }, "drop", -1)]]),
							_: 1
						}, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[182] ||= [E(" What happens to traffic not covered by a rule above. Egress defaults to allow (deny-list model — Internet stays reachable unless explicitly blocked); ingress defaults to drop (nothing reaches a container unsolicited). Tailscale's CGNAT range (100.64.0.0/10) is blocked by default; add only the narrow allow-hole a container genuinely needs rather than exposing the whole tailnet. ", -1)]]),
							_: 1
						})
					]),
					M("div", ao, [
						S(y(Q), {
							for: "new-blocked-cidr",
							class: "mb-1.5 block"
						}, {
							default: g(() => [...a[183] ||= [E("Blocked CIDRs (deny-list)", -1)]]),
							_: 1
						}),
						vt.value.length > 0 ? (h(), k("div", oo, [(h(!0), k(O, null, t(vt.value, (e) => (h(), k("span", {
							key: e,
							class: "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs"
						}, [E(w(e) + " ", 1), M("button", {
							type: "button",
							"aria-label": `Remove blocked CIDR ${e}`,
							class: "cursor-pointer text-muted-foreground hover:text-destructive",
							onClick: (t) => Tt(e)
						}, "✕", 8, so)]))), 128))])) : T("", !0),
						M("div", co, [S(y(Z), {
							id: "new-blocked-cidr",
							modelValue: bt.value,
							"onUpdate:modelValue": a[36] ||= (e) => bt.value = e,
							class: "w-full font-mono",
							placeholder: "e.g. 10.0.0.0/8",
							onKeydown: Nt(jt(wt, ["prevent"]), ["enter"])
						}, null, 8, ["modelValue", "onKeydown"]), S(y(A), {
							size: "sm",
							variant: "outline",
							disabled: !bt.value.trim(),
							onClick: wt
						}, {
							default: g(() => [...a[184] ||= [E("Add", -1)]]),
							_: 1
						}, 8, ["disabled"])]),
						St.value ? (h(), k("p", lo, w(St.value), 1)) : T("", !0),
						S(y($), null, {
							default: g(() => [...a[185] ||= [E(" Ranges containers may not reach — this is the actual LAN ban. Add one CIDR at a time; defaults to the private IPv4 ranges (RFC 1918) plus link-local addresses. ", -1)]]),
							_: 1
						})
					]),
					M("div", uo, [
						S(y(Q), {
							for: "new-allow-cidr",
							class: "mb-1.5 block"
						}, {
							default: g(() => [...a[186] ||= [E("Allow-holes (punched before block rules)", -1)]]),
							_: 1
						}),
						yt.value.length > 0 ? (h(), k("div", fo, [(h(!0), k(O, null, t(yt.value, (e) => (h(), k("span", {
							key: e,
							class: "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs"
						}, [E(w(e) + " ", 1), M("button", {
							type: "button",
							"aria-label": `Remove allowed CIDR ${e}`,
							class: "cursor-pointer text-muted-foreground hover:text-destructive",
							onClick: (t) => Dt(e)
						}, "✕", 8, po)]))), 128))])) : T("", !0),
						M("div", mo, [S(y(Z), {
							id: "new-allow-cidr",
							modelValue: xt.value,
							"onUpdate:modelValue": a[37] ||= (e) => xt.value = e,
							class: "w-full font-mono",
							placeholder: "e.g. 100.64.0.0/10",
							onKeydown: Nt(jt(Et, ["prevent"]), ["enter"])
						}, null, 8, ["modelValue", "onKeydown"]), S(y(A), {
							size: "sm",
							variant: "outline",
							disabled: !xt.value.trim(),
							onClick: Et
						}, {
							default: g(() => [...a[187] ||= [E("Add", -1)]]),
							_: 1
						}, 8, ["disabled"])]),
						Ct.value ? (h(), k("p", ho, w(Ct.value), 1)) : T("", !0),
						S(y($), null, {
							default: g(() => [...a[188] ||= [E(" Exceptions punched through the block list before it's evaluated — e.g. one specific internal service (a local LLM, a search index) a container legitimately needs to reach. ", -1)]]),
							_: 1
						})
					]),
					M("div", go, [
						a[191] ||= M("h4", { class: "mb-3 text-sm font-semibold" }, "Tailscale", -1),
						a[192] ||= M("p", { class: "mb-4 text-xs text-muted-foreground" }, " Optional — when set, new containers automatically join your tailnet using this key. ", -1),
						M("div", _o, [
							S(y(Q), { for: "tailscale-auth-key" }, {
								default: g(() => [...a[189] ||= [E("Tailscale auth key", -1)]]),
								_: 1
							}),
							M("div", vo, [
								S(y(Z), {
									id: "tailscale-auth-key",
									modelValue: Ee.value,
									"onUpdate:modelValue": a[38] ||= (e) => Ee.value = e,
									type: Te.value ? "text" : "password",
									class: "w-72 font-mono",
									placeholder: x.tsAuthKeyConfigured ? "Configured — enter a replacement" : "tskey-auth-…"
								}, null, 8, [
									"modelValue",
									"type",
									"placeholder"
								]),
								S(y(A), {
									size: "sm",
									variant: "outline",
									onClick: a[39] ||= (e) => Te.value = !Te.value
								}, {
									default: g(() => [E(w(Te.value ? "Hide" : "Show"), 1)]),
									_: 1
								}),
								x.tsAuthKeyConfigured ? (h(), C(y(A), {
									key: 0,
									size: "sm",
									variant: "outline",
									onClick: a[40] ||= (e) => De.value = !De.value
								}, {
									default: g(() => [E(w(De.value ? "Keep key" : "Clear on save"), 1)]),
									_: 1
								})) : T("", !0)
							]),
							S(y($), { class: "col-span-2" }, {
								default: g(() => [...a[190] ||= [E(" The stored key is write-only and is never returned to this page. A reusable or ephemeral key from your Tailscale admin console. Best-effort: if a container's image doesn't have Tailscale installed, joining is silently skipped rather than failing the launch — it never blocks a container from starting. ", -1)]]),
								_: 1
							})
						])
					])
				]),
				M("section", yo, [
					a[214] ||= M("p", { class: "mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground" }, "Container Defaults", -1),
					a[215] ||= M("h3", { class: "mb-4 text-base font-semibold" }, "Defaults", -1),
					M("div", bo, [
						S(y(Q), { for: "config-profile" }, {
							default: g(() => [...a[196] ||= [E("Container profile", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-profile",
							modelValue: x.jailProfile,
							"onUpdate:modelValue": a[41] ||= (e) => x.jailProfile = e,
							class: "w-48 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[197] ||= [E(" The Incus profile new containers launch with — sets resource limits, network, and mounts, defined in the array-start init script's profile template. ", -1)]]),
							_: 1
						}),
						S(y(Q), { for: "config-image" }, {
							default: g(() => [...a[198] ||= [E("Default image", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-image",
							modelValue: x.jailImage,
							"onUpdate:modelValue": a[42] ||= (e) => x.jailImage = e,
							class: "w-96 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[199] ||= [
								E(" Used when launching a container without picking a specific image — either a remote reference like ", -1),
								M("span", { class: "font-mono" }, "images:debian/trixie/cloud", -1),
								E(", or a locally-built image's alias. Marking an image as the golden master in the Builder tab sets this automatically. ", -1)
							]]),
							_: 1
						}),
						S(y(Q), { for: "config-nesting" }, {
							default: g(() => [...a[200] ||= [E("Allow nesting", -1)]]),
							_: 1
						}),
						S(y(sn), {
							id: "config-nesting",
							modelValue: x.jailNesting,
							"onUpdate:modelValue": a[43] ||= (e) => x.jailNesting = e
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[201] ||= [E(" Lets a container run Docker or Incus inside itself — needed for agents that spin up their own sandboxes, but widens what a compromised container could reach. ", -1)]]),
							_: 1
						}),
						S(y(Q), { for: "config-cpu" }, {
							default: g(() => [...a[202] ||= [E("CPU limit", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-cpu",
							modelValue: x.jailCpu,
							"onUpdate:modelValue": a[44] ||= (e) => x.jailCpu = e,
							class: "w-24 justify-self-end font-mono",
							placeholder: "empty = no cap"
						}, null, 8, ["modelValue"]),
						ee.value ? (h(), k("p", xo, w(ee.value), 1)) : T("", !0),
						S(y(Q), { for: "config-memory" }, {
							default: g(() => [...a[203] ||= [E("Memory limit", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-memory",
							modelValue: x.jailMemory,
							"onUpdate:modelValue": a[45] ||= (e) => x.jailMemory = e,
							class: "w-24 justify-self-end font-mono",
							placeholder: "empty = no cap"
						}, null, 8, ["modelValue"]),
						ne.value ? (h(), k("p", So, w(ne.value), 1)) : T("", !0),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[204] ||= [
								E(" Hard resource ceiling applied via the container profile at launch — CPU as a core count (e.g. ", -1),
								M("span", { class: "font-mono" }, "2", -1),
								E("), memory with a unit (e.g. ", -1),
								M("span", { class: "font-mono" }, "4GiB", -1),
								E("). Leave either empty for no cap. ", -1)
							]]),
							_: 1
						}),
						S(y(Q), { for: "config-workspace" }, {
							default: g(() => [...a[205] ||= [E("Workspace root", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-workspace",
							modelValue: x.jailWorkspaceRoot,
							"onUpdate:modelValue": a[46] ||= (e) => x.jailWorkspaceRoot = e,
							class: "w-96 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[206] ||= [
								E(" Host directory holding per-container workspaces, bind-mounted in with idmap shifting. Must be real persistent storage — the init script refuses to start if it's tmpfs, since that would silently lose \"persistent\" data on every reboot. Prefer a real device mount (e.g. ", -1),
								M("span", { class: "font-mono" }, "/mnt/cache/appdata/...", -1),
								E(") over a ", -1),
								M("span", { class: "font-mono" }, "/mnt/user/...", -1),
								E(" path — Unraid's shfs FUSE union view generally doesn't support the idmapped-mount feature the shift needs. ", -1)
							]]),
							_: 1
						}),
						S(y(Q), { for: "config-agent-uid" }, {
							default: g(() => [...a[207] ||= [E("Agent UID", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-agent-uid",
							modelValue: x.jailAgentUid,
							"onUpdate:modelValue": a[47] ||= (e) => x.jailAgentUid = e,
							class: "w-24 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						S(y(Q), { for: "config-agent-gid" }, {
							default: g(() => [...a[208] ||= [E("Agent GID", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-agent-gid",
							modelValue: x.jailAgentGid,
							"onUpdate:modelValue": a[48] ||= (e) => x.jailAgentGid = e,
							class: "w-24 justify-self-end font-mono"
						}, null, 8, ["modelValue"]),
						S(y($), { class: "col-span-2" }, {
							default: g(() => [...a[209] ||= [E(" The uid/gid inside each container mapped to your host user — match your own host user if you want files under the bind-mounted workspace to show correct ownership from outside the container. ", -1)]]),
							_: 1
						})
					]),
					M("div", Co, [
						a[212] ||= M("h4", { class: "mb-3 text-sm font-semibold" }, "Bind mounts", -1),
						S(y(Q), {
							for: "config-bind-mounts",
							class: "mb-2 block"
						}, {
							default: g(() => [...a[210] ||= [E("Host config bind-mounts", -1)]]),
							_: 1
						}),
						S(y(Z), {
							id: "config-bind-mounts",
							modelValue: x.jailBindMounts,
							"onUpdate:modelValue": a[49] ||= (e) => x.jailBindMounts = e,
							class: "w-full font-mono",
							placeholder: "/boot/config/plugins/incus/bind-mounts/claude:/home/agent/.claude:ro"
						}, null, 8, ["modelValue"]),
						a[213] ||= M("p", { class: "mt-2 text-xs text-muted-foreground" }, " Comma-separated host:container[:ro|rw] triples from approved roots. Mounts default to read-only; only sources beneath the workspace root may be writable. ", -1),
						S(y($), null, {
							default: g(() => [...a[211] ||= [
								E(" Copy curated agent config under ", -1),
								M("span", { class: "font-mono" }, "/boot/config/plugins/incus/bind-mounts", -1),
								E(" rather than exposing host home or system paths. Sources must resolve beneath that directory or the configured workspace root; config-root mounts are always read-only. ", -1)
							]]),
							_: 1
						})
					])
				])
			]), M("div", wo, [S(y(A), {
				disabled: s.value || !!ee.value || !!ne.value,
				onClick: je
			}, {
				default: g(() => [E(w(s.value ? "Applying…" : "Apply"), 1)]),
				_: 1
			}, 8, ["disabled"])])])) : T("", !0)
		], 64)), ie.value ? (h(), C(y(n), {
			key: 2,
			"jail-name": ie.value,
			onClose: a[50] ||= (e) => ie.value = null
		}, null, 8, ["jail-name"])) : T("", !0)]));
	}
}), { shadowRoot: !1 });
customElements.get("incus-settings-app") || customElements.define("incus-settings-app", ko);
