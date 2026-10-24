// node_modules/smol-toml/dist/error.js
function e(e, t) {
	let n = e.slice(0, t).split(/\r?\n/);
	return [n.length, n.pop().length + 1];
}
function t(e, t, n) {
	let r = e.split(/\r?\n/), i = "", a = (Math.log10(t + 1) | 0) + 1;
	for (let e = t - 1; e <= t + 1; e++) {
		let o = r[e - 1];
		o && (i += e.toString().padEnd(a, " "), i += ":  ", i += o, i += "\n", e === t && (i += " ".repeat(a + n + 2), i += "^\n"));
	}
	return i;
}
var n = class n extends Error {
	line;
	column;
	codeblock;
	constructor(n, r) {
		let [i, a] = e(r.toml, r.ptr), o = t(r.toml, i, a);
		super(`Invalid TOML document: ${n}\n\n${o}`, r), this.line = i, this.column = a, this.codeblock = o;
	}
	static x(e, t, r) {
		throw new n(e, {
			toml: t.s,
			ptr: r ?? t.p
		});
	}
};
// node_modules/smol-toml/dist/primitive.js
function r(e) {
	let t = e.p, r = e.s.charCodeAt(e.p++), i = r, a = r === 39, o = r === e.s.charCodeAt(e.p) && r === e.s.charCodeAt(e.p + 1);
	o && ((r = e.s.charCodeAt(e.p += 2)) === 10 ? e.p++ : r === 13 && e.s.charCodeAt(e.p + 1) === 10 && (e.p += 2));
	let s = "", c = e.p, l = 0;
	for (; e.p < e.s.length; e.p++) if (r = e.s.charCodeAt(e.p), o && (r === 10 || r === 13 && e.s.charCodeAt(e.p + 1) === 10)) l &&= 3;
	else if (r < 32 && r !== 9 || r === 127) n.x("control characters are not allowed in strings", e);
	else if ((!l || l === 3) && r === i && (!o || e.s.charCodeAt(e.p + 1) === i && e.s.charCodeAt(e.p + 2) === i)) {
		if (o && (e.s.charCodeAt(e.p + 3) === i && e.p++, e.s.charCodeAt(e.p + 3) === i && e.p++), !l) {
			let t = e.s.slice(c, e.p);
			s = s ? s + t : t;
		}
		return e.p += o ? 3 : 1, s;
	} else if (!l) !a && r === 92 && (s += e.s.slice(c, c = e.p), l = 1);
	else if (l === 1) {
		if (r === 120 || r === 117 || r === 85) {
			let t = e.p++ - 1, i = 0, a = r === 120 ? 2 : r === 117 ? 4 : 8;
			for (let t = 0; t < a; t++, e.p++) {
				let t = e.s.charCodeAt(e.p), r = t >= 48 && t <= 57 ? t - 48 : t >= 65 && t <= 70 ? t - 65 + 10 : t >= 97 && t <= 102 ? t - 97 + 10 : -1;
				r < 0 && n.x("invalid non-hex character in unicode escape", e), i = i << 4 | r;
			}
			(i < 0 || i > 1114111 || i >= 55296 && i <= 57343) && n.x("invalid unicode escape", e, t), s += String.fromCodePoint(i), c = e.p--, l = 0;
		} else o && (r === 32 || r === 9) ? l = 2 : (r === 98 ? s += "\b" : r === 116 ? s += "	" : r === 110 ? s += "\n" : r === 102 ? s += "\f" : r === 114 ? s += "\r" : r === 101 ? s += "\x1B" : r === 34 ? s += "\"" : r === 92 ? s += "\\" : n.x("unrecognised escape sequence", e), c = e.p + 1, l = 0);
	} else r !== 32 && r !== 9 && (l === 2 && n.x("invalid escape: only line-ending whitespace may be escaped", e, c), l = +(!a && r === 92), c = e.p);
	n.x("unfinished string", e, t);
}
// node_modules/smol-toml/dist/date.js
var i = /^(\d{4}-\d{2}-\d{2})?[Tt ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|z|[-+]\d{2}:\d{2})?$/i, a = class e extends Date {
	#e = !1;
	#t = !1;
	#n = null;
	constructor(e, t, n) {
		let r = !0, a = !0, o = "Z", s;
		if (typeof e == "string") {
			if (t) prep: {
				if (t < 3) {
					if (+e.slice(11, 13) > 23) {
						e = "";
						break prep;
					}
					t === 2 ? (o = null, e += "Z") : (s = e.charCodeAt(e.length - 1)) !== 90 && s !== 122 && (o = e.slice(e.length - 6)), n && (e = e.slice(0, 10) + "T" + e.slice(11));
				} else t === 4 && (e = +e.slice(0, 2) > 23 ? "" : `0000-01-01T${e}Z`);
				r = t !== 4, a = t !== 3;
			}
			else {
				let t = e.match(i);
				t ? (t[1] || (r = !1, e = `0000-01-01T${e}`), a = !!t[2], a && e[10] === " " && (e = e.replace(" ", "T")), t[2] && +t[2] > 23 ? e = "" : (o = t[3] || null, !o && a && (e += "Z"))) : e = "";
			}
		}
		super(e), isNaN(this.getTime()) || (this.#e = r, this.#t = a, this.#n = o);
	}
	isDateTime() {
		return this.#e && this.#t;
	}
	isLocal() {
		return !this.#e || !this.#t || !this.#n;
	}
	isDate() {
		return this.#e && !this.#t;
	}
	isTime() {
		return this.#t && !this.#e;
	}
	isValid() {
		return this.#e || this.#t;
	}
	toISOString() {
		let e = super.toISOString();
		if (this.isDate()) return e.slice(0, 10);
		if (this.isTime()) return e.slice(11, 23);
		if (this.#n === null) return e.slice(0, -1);
		if (this.#n === "Z" || this.#n === "z") return e;
		let t = this.#n.slice(1, 3) * 60 + +this.#n.slice(4, 6);
		return t = this.#n[0] === "-" ? t : -t, (/* @__PURE__ */ new Date(this.getTime() - t * 6e4)).toISOString().slice(0, -1) + this.#n;
	}
	static wrapAsOffsetDateTime(t, n = "Z") {
		let r = new e(t);
		return r.#n = n, r;
	}
	static wrapAsLocalDateTime(t) {
		let n = new e(t);
		return n.#n = null, n;
	}
	static wrapAsLocalDate(t) {
		let n = new e(t);
		return n.#t = !1, n.#n = null, n;
	}
	static wrapAsLocalTime(t) {
		let n = new e(t);
		return n.#e = !1, n.#n = null, n;
	}
};
// node_modules/smol-toml/dist/extract.js
function o(e, t = 10) {
	return t === 16 ? e > 47 && e < 58 || e > 64 && e < 71 || e > 96 && e < 103 : e > 47 && e < 48 + t;
}
function s(e, t) {
	return e === 32 || e === 9 || e === 10 || e === 13 || t && (e === t || e === 44) || e === 35;
}
function c(e, t) {
	let i = e.p, a = e.s.charCodeAt(e.p);
	if (a === 91 || a === 123) {
		e.d-- || n.x("document contains excessively nested structures. aborting.", e);
		let t = a === 91 ? y(e) : v(e);
		return e.d++, t;
	}
	return a === 34 || a === 39 ? r(e) : a === 116 ? ((e.s.charCodeAt(++e.p) !== 114 || e.s.charCodeAt(++e.p) !== 117 || e.s.charCodeAt(++e.p) !== 101) && n.x("invalid value", e, i), e.p++, !0) : a === 102 ? ((e.s.charCodeAt(++e.p) !== 97 || e.s.charCodeAt(++e.p) !== 108 || e.s.charCodeAt(++e.p) !== 115 || e.s.charCodeAt(++e.p) !== 101) && n.x("invalid value", e, i), e.p++, !1) : a === 43 || a === 45 ? l(e, e.p, e.s.charCodeAt(++e.p), 44 - a, t) : e.s.charCodeAt(e.p + 4) === 45 && e.s.charCodeAt(e.p + 7) === 45 ? f(e, a, t) : e.s.charCodeAt(e.p + 2) === 58 ? p(e, a, t) : l(e, e.p, a, 0, t);
}
function l(e, t, r, i, a) {
	let c = r, l = 0, f = !1;
	if (c === 105) return (e.s.charCodeAt(++e.p) !== 110 || e.s.charCodeAt(++e.p) !== 102) && n.x("invalid value", e, t), e.p++, (i || 1) / 0;
	if (c === 110) return (e.s.charCodeAt(++e.p) !== 97 || e.s.charCodeAt(++e.p) !== 110) && n.x("invalid value", e, t), e.p++, NaN;
	if (c === 48) {
		if (++e.p >= e.s.length || s(c = e.s.charCodeAt(e.p), a)) return e.bi === !0 ? 0n : 0;
		if (!i) {
			if (c === 120) return u(e, t, 16, a);
			if (c === 98) return u(e, t, 2, a);
			if (c === 111) return u(e, t, 8, a);
		}
		c === 46 ? l = 2 : c === 101 || c === 69 ? l = 4 : n.x("illegal leading zero", e, t);
	} else o(c) || n.x("invalid value", e, t);
	for (; ++e.p < e.s.length && (c = e.s.charCodeAt(e.p), !s(c, a));) l ||= 1, c === 95 ? (l & 1 || n.x("illegal underscore", e), l += 11, f = !0) : l === 1 && c === 46 ? l = 2 : (l === 1 || l === 3) && (c === 101 || c === 69) ? l = 4 : l === 4 && (c === 43 || c === 45) ? l = 6 : o(c) ? l > 9 ? l -= 11 : l & 1 || l++ : n.x("illegal character in numeric literal", e);
	if (!l) {
		let t = (r - 48) * (i || 1);
		return e.bi === !0 ? BigInt(t) : t;
	}
	l & 1 || n.x("unfinished numeric value", e, t);
	let p = e.s.slice(t, e.p);
	return f && (p = p.replaceAll("_", "")), l > 1 ? parseFloat(p) : d(e, p, 10, t);
}
function u(e, t, r, i) {
	let a, c = 1;
	for (; ++e.p < e.s.length && (a = e.s.charCodeAt(e.p), !s(a, i));) a === 95 ? (c & 1 && n.x("illegal underscore", e), c = 3) : o(a, r) ? c & 1 && c-- : n.x("illegal character in numeric literal", e);
	c & 1 && n.x("unfinished numeric value", e);
	let l = e.s.slice(t + 2, e.p);
	return c && (l = l.replaceAll("_", "")), d(e, l, r, t);
}
function d(e, t, r, i) {
	if (e.bi !== !0) int: {
		let a = parseInt(t, r);
		if (!Number.isSafeInteger(a)) {
			if (e.bi) break int;
			n.x("integer value cannot be represented losslessly", e, i);
		}
		return a;
	}
	return BigInt(r === 10 ? t : (r === 2 ? "0b" : r === 8 ? "0o" : "0x") + t);
}
function f(e, t, r) {
	let i = e.p++, a;
	if (!o(t) || !o(e.s.charCodeAt(e.p++)) || !o(e.s.charCodeAt(e.p++)) || !o(e.s.charCodeAt(e.p++))) return l(e, e.p = i, t, 0, r);
	if (e.p += 5, o(e.s.charCodeAt(e.p++)) || n.x("invalid date-time: date part is malformed", e, i), e.p >= e.s.length || ((t = e.s.charCodeAt(e.p)) !== 32 || (a = !0, !o(e.s.charCodeAt(e.p + 1)))) && t !== 84 && t !== 116) return m(e, e.s.slice(i, e.p), 3, !1, i);
	if (e.s.charCodeAt(e.p += 3) !== 58 && n.x("invalid date-time: time part is malformed", e, i), e.s.charCodeAt(e.p += 3) === 58 && (e.p += 3), e.s.charCodeAt(e.p) === 46) for (; o(e.s.charCodeAt(++e.p)););
	if (t = e.s.charCodeAt(e.p)) {
		if (t === 90 || t === 122) return m(e, e.s.slice(i, ++e.p), 1, a, i, "[+00:00]");
		if (t === 43 || t === 45) return m(e, e.s.slice(i, e.p += 6), 1, a, i, !e.ld && "[" + e.s.slice(e.p - 6, e.p) + "]");
	}
	return m(e, e.s.slice(i, e.p), 2, a, i);
}
function p(e, t, n) {
	let r = e.p;
	if (!o(t) || !o(e.s.charCodeAt(++e.p))) return l(e, --e.p, t, 0, n);
	if (e.s.charCodeAt(e.p += 4) === 58 && (e.p += 3), e.s.charCodeAt(e.p) === 46) for (; o(e.s.charCodeAt(++e.p)););
	return m(e, e.s.slice(r, e.p), 4, !1, r);
}
function m(e, t, r, i, o, s) {
	if (e.ld) {
		let s = new a(t, r, i);
		return s.isValid() || n.x("invalid date", e, o), s;
	}
	try {
		switch (s && (t += s), r) {
			case 1: return Temporal.ZonedDateTime.from(t);
			case 2: return Temporal.PlainDateTime.from(t);
			case 3: return Temporal.PlainDate.from(t);
			case 4: return Temporal.PlainTime.from(t);
		}
	} catch (t) {
		n.x(t instanceof Error ? t.message : "" + t, e, o);
	}
}
// node_modules/smol-toml/dist/util.js
function h(e) {
	for (; e.p < e.s.length; e.p++) {
		let t = e.s.charCodeAt(e.p);
		if (t === 10) break;
		if (t === 13 && e.s.charCodeAt(e.p + 1) === 10) {
			e.p++;
			break;
		}
		(t < 32 && t !== 9 || t === 127) && n.x("control characters are not allowed in comments", e);
	}
}
function g(e, t, n) {
	let r;
	for (; e.p < e.s.length;) {
		for (; e.p < e.s.length && ((r = e.s.charCodeAt(e.p)) === 32 || r === 9 || !t && (r === 10 || r === 13 && e.s.charCodeAt(e.p + 1) === 10));) e.p++;
		if (n || r !== 35) break;
		h(e);
	}
}
// node_modules/smol-toml/dist/struct.js
function _(e, t = 61) {
	let i, a = 0, o = [], s, c = e.s.charCodeAt(i = e.p);
	do
		if (c === t) return a || n.x("unexpected end of key", e), a === 1 && o.push(e.s.slice(s, e.p)), e.p++, o;
		else c === 46 ? (a || n.x("illegal empty bare key", e), a === 1 && o.push(e.s.slice(s, e.p)), a = 0) : !a && (c === 34 || c === 39) ? (c === e.s.charCodeAt(e.p + 1) && c === e.s.charCodeAt(e.p + 2) && n.x("illegal quoted key: multiline strings are not allowed", e), o.push(r(e)), a = 2, e.p--) : c === 32 || c === 9 ? a === 1 && (o.push(e.s.slice(s, e.p)), a = 2) : a === 2 || c < 48 && c !== 45 || c > 57 && c < 65 || c > 90 && c < 97 && c !== 95 || c > 122 ? n.x("illegal character in key", e) : a || (a = 1, s = e.p);
	while (c = e.s.charCodeAt(++e.p));
	n.x("incomplete key-value: cannot find end of key", e, i);
}
function v(e) {
	let t = e.p++, r = Object.create(null), i = /* @__PURE__ */ new Set(), a;
	for (; e.p < e.s.length;) {
		if (g(e), (a = e.s.charCodeAt(e.p)) === 125) return e.p++, r;
		let t, o = r, s = !1, l = e.p, u = _(e);
		for (let r = 0; r < u.length; r++) {
			r && (o = s ? o[t] : o[t] = Object.create(null)), t = u[r], (s = Object.hasOwn(o, t)) && (typeof o[t] != "object" || i.has(o[t])) && n.x("trying to redefine an already defined value", e, l);
			let a = t === "__proto__";
			if (e.uk && (a || t === "constructor")) {
				o = e.uk !== 1 && n.x("document contains an unsafe property", e, l);
				break;
			}
			!s && a && Object.defineProperty(o, t, {
				enumerable: !0,
				configurable: !0,
				writable: !0
			});
		}
		s && n.x("trying to redefine an already defined value", e, l), g(e, !0, !0);
		let d = c(e, 125);
		if (o && typeof (o[t] = d) == "object" && i.add(d), g(e), (a = e.s.charCodeAt(e.p++)) === 125) return r;
		a !== 44 && n.x("expected comma or end of structure", e, e.p - 1);
	}
	n.x("unfinished table", e, t);
}
function y(e) {
	let t = e.p++, r = [], i;
	for (; e.p < e.s.length;) {
		if (g(e), (i = e.s.charCodeAt(e.p)) === 93) return e.p++, r;
		if (r.push(c(e, 93)), g(e), (i = e.s.charCodeAt(e.p++)) === 93) return r;
		i !== 44 && n.x("expected comma or end of structure", e, e.p - 1);
	}
	n.x("unfinished array", e, t);
}
// node_modules/smol-toml/dist/parse.js
function b(e, t, n, r, i) {
	let a = n, o = r, s, c = !1, l;
	for (let n = 0; n < t.length; n++) {
		if (n) {
			if (a = c ? a[s] : a[s] = Object.create(null), o = (l = o[s]).c, i === 0 && (l.t === 1 || l.t === 2)) return null;
			if (l.t === 2) {
				let e = a.length - 1;
				a = a[e], o = o[e].c;
			}
		}
		if (s = t[n], (c = Object.hasOwn(a, s)) && o[s]?.t === 0 && o[s]?.d) return null;
		if (!c) {
			let r = s === "__proto__";
			if (e.uk && (r || s === "constructor")) return !1;
			r && (Object.defineProperty(a, s, {
				enumerable: !0,
				configurable: !0,
				writable: !0
			}), Object.defineProperty(o, s, {
				enumerable: !0,
				configurable: !0,
				writable: !0
			})), o[s] = {
				t: n < t.length - 1 && i === 2 ? 3 : i,
				d: !1,
				i: 0,
				c: Object.create(null)
			};
		}
	}
	if (l = o[s], l.t !== i && (i !== 1 || l.t !== 3) || (i === 2 && (l.d || (l.d = !0, a[s] = []), a[s].push(a = Object.create(null)), l.c[l.i++] = l = {
		t: 1,
		d: !1,
		i: 0,
		c: Object.create(null)
	}), l.d)) return null;
	if (l.d = !0, i === 1) a = c ? a[s] : a[s] = Object.create(null);
	else if (i === 0 && c) return null;
	return [
		s,
		a,
		l.c
	];
}
function x(e, t, r) {
	(t === null || e.uk === 2) && n.x(t === null ? "trying to redefine an already defined table or value" : "document contains an unsafe property", e, r);
}
function S(e, t = {}) {
	let r = {
		s: e,
		p: 0,
		d: t.maxDepth ?? 1e3,
		bi: t.integersAsBigInt ?? !1,
		ld: t.useLegacyDate ?? !0,
		uk: t.unsafeKeyBehaviour === "throw" ? 2 : +(t.unsafeKeyBehaviour === "drop")
	}, i = Object.create(null), a = Object.create(null), o, s = !1, l = i, u = a;
	for (e.charCodeAt(0) === 65279 && r.p++, g(r); r.p < e.length;) {
		if (e.charCodeAt(r.p) === 91) {
			let t = e.charCodeAt(++r.p) === 91;
			o = r.p += +t, s = !1;
			let c = _(r, 93);
			t && (e.charCodeAt(r.p) !== 93 && n.x("expected end of table array declaration", r), r.p++);
			let d = b(r, c, i, a, t ? 2 : 1);
			d ? (u = d[2], l = d[1]) : (x(r, d, o), s = !0);
		} else {
			o = r.p;
			let e = b(r, _(r), l, u, 0);
			!e && !s && x(r, e, o), g(r, !0, !0);
			let t = c(r, void 0);
			e && !s && (e[1][e[0]] = t);
		}
		g(r, !0), r.p < e.length && (o = e.charCodeAt(r.p)) !== 10 && (o !== 13 || e.charCodeAt(r.p + 1) !== 10) && n.x("each key-value declaration must be followed by an end-of-line", r), g(r);
	}
	return i;
}
"".isWellFormed;
export { S as parse };
