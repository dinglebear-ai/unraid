var V = Object.defineProperty;
var C = (e) => {
  throw TypeError(e);
};
var v = (e, n, t) => n in e ? V(e, n, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[n] = t;
var _ = (e, n, t) => v(e, typeof n != "symbol" ? n + "" : n, t), j = (e, n, t) => n.has(e) || C("Cannot " + t);
var d = (e, n, t) => (j(e, n, "read from private field"), t ? t.call(e) : n.get(e)), p = (e, n, t) => n.has(e) ? C("Cannot add the same private member more than once") : n instanceof WeakSet ? n.add(e) : n.set(e, t), y = (e, n, t, i) => (j(e, n, "write to private field"), i ? i.call(e, t) : n.set(e, t), t);
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
let M = /^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[-+]\d{2}:\d{2})?$/i;
var b, x, w;
const E = class E extends Date {
  constructor(t) {
    let i = !0, r = !0, f = "Z";
    if (typeof t == "string") {
      let l = t.match(M);
      l ? (l[1] || (i = !1, t = `0000-01-01T${t}`), r = !!l[2], r && t[10] === " " && (t = t.replace(" ", "T")), l[2] && +l[2] > 23 ? t = "" : (f = l[3] || null, t = t.toUpperCase(), !f && r && (t += "Z"))) : t = "";
    }
    super(t);
    p(this, b, !1);
    p(this, x, !1);
    p(this, w, null);
    isNaN(this.getTime()) || (y(this, b, i), y(this, x, r), y(this, w, f));
  }
  isDateTime() {
    return d(this, b) && d(this, x);
  }
  isLocal() {
    return !d(this, b) || !d(this, x) || !d(this, w);
  }
  isDate() {
    return d(this, b) && !d(this, x);
  }
  isTime() {
    return d(this, x) && !d(this, b);
  }
  isValid() {
    return d(this, b) || d(this, x);
  }
  toISOString() {
    let t = super.toISOString();
    if (this.isDate())
      return t.slice(0, 10);
    if (this.isTime())
      return t.slice(11, 23);
    if (d(this, w) === null)
      return t.slice(0, -1);
    if (d(this, w) === "Z")
      return t;
    let i = +d(this, w).slice(1, 3) * 60 + +d(this, w).slice(4, 6);
    return i = d(this, w)[0] === "-" ? i : -i, new Date(this.getTime() - i * 6e4).toISOString().slice(0, -1) + d(this, w);
  }
  static wrapAsOffsetDateTime(t, i = "Z") {
    let r = new E(t);
    return y(r, w, i), r;
  }
  static wrapAsLocalDateTime(t) {
    let i = new E(t);
    return y(i, w, null), i;
  }
  static wrapAsLocalDate(t) {
    let i = new E(t);
    return y(i, x, !1), y(i, w, null), i;
  }
  static wrapAsLocalTime(t) {
    let i = new E(t);
    return y(i, b, !1), y(i, w, null), i;
  }
};
b = new WeakMap(), x = new WeakMap(), w = new WeakMap();
let S = E;
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
function G(e, n) {
  let t = e.slice(0, n).split(/\r\n|\n|\r/g);
  return [t.length, t.pop().length + 1];
}
function U(e, n, t) {
  let i = e.split(/\r\n|\n|\r/g), r = "", f = (Math.log10(n + 1) | 0) + 1;
  for (let l = n - 1; l <= n + 1; l++) {
    let a = i[l - 1];
    a && (r += l.toString().padEnd(f, " "), r += ":  ", r += a, r += `
`, l === n && (r += " ".repeat(f + t + 2), r += `^
`));
  }
  return r;
}
class c extends Error {
  constructor(t, i) {
    const [r, f] = G(i.toml, i.ptr), l = U(i.toml, r, f);
    super(`Invalid TOML document: ${t}

${l}`, i);
    _(this, "line");
    _(this, "column");
    _(this, "codeblock");
    this.line = r, this.column = f, this.codeblock = l;
  }
}
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
let K = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/, X = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/, Y = /^[+-]?0[0-9_]/;
function Z(e, n) {
  let t = e[n++], i = t, r = t === "'", f = t === e[n] && t === e[n + 1];
  f && (e[n += 2] === `
` ? n++ : e[n] === "\r" && e[n + 1] === `
` && (n += 2));
  let l = "", a = n, u = 0;
  for (let o = n; o < e.length; o++)
    if (t = e[o], f && (t === `
` || t === "\r" && e[o + 1] === `
`))
      u = u && 3;
    else {
      if (t < " " && t !== "	" || t === "")
        throw new c("control characters are not allowed in strings", {
          toml: e,
          ptr: o
        });
      if ((!u || u === 3) && t === i && (!f || e[o + 1] === i && e[o + 2] === i))
        return f && (e[o + 3] === i && o++, e[o + 3] === i && o++), [
          // If we're in a newline escape still, then there's nothing to add.
          // Also try to avoid concat if there's nothing to add to parsed, or nothing has been added to parsed.
          u ? l : l + e.slice(a, o),
          o + (f ? 3 : 1)
        ];
      if (!u)
        !r && t === "\\" && (l += e.slice(a, a = o), u = 1);
      else if (u === 1)
        if (t === "x" || t === "u" || t === "U") {
          let s = 0, h = t === "x" ? 2 : t === "u" ? 4 : 8;
          for (let m = 0; m < h; m++, o++) {
            let g = e.charCodeAt(o + 1), T = (
              /* 0-9 */
              g >= 48 && g <= 57 ? g - 48 : (
                /* A-F */
                g >= 65 && g <= 70 ? g - 65 + 10 : (
                  /* a-f */
                  g >= 97 && g <= 102 ? g - 97 + 10 : -1
                )
              )
            );
            if (T < 0)
              throw new c("invalid non-hex character in unicode escape", { toml: e, ptr: o + 1 });
            s = s << 4 | T;
          }
          if (s < 0 || s > 1114111 || s >= 55296 && s <= 57343)
            throw new c("invalid unicode escape", { toml: e, ptr: o });
          l += String.fromCodePoint(s), a = o + 1, u = 0;
        } else if (t === " " || t === "	")
          u = 2;
        else {
          if (t === "b")
            l += "\b";
          else if (t === "t")
            l += "	";
          else if (t === "n")
            l += `
`;
          else if (t === "f")
            l += "\f";
          else if (t === "r")
            l += "\r";
          else if (t === "e")
            l += "\x1B";
          else if (t === '"')
            l += '"';
          else if (t === "\\")
            l += "\\";
          else
            throw new c("unrecognized escape sequence", { toml: e, ptr: o });
          a = o + 1, u = 0;
        }
      else if (t !== " " && t !== "	") {
        if (u === 2)
          throw new c("invalid escape: only line-ending whitespace may be escaped", {
            toml: e,
            ptr: a
          });
        u = !r && t === "\\" ? 1 : 0, a = o;
      }
    }
  throw new c("unfinished string", { toml: e, ptr: n });
}
function q(e, n, t, i) {
  if (e === "true")
    return !0;
  if (e === "false")
    return !1;
  if (e === "-inf")
    return -1 / 0;
  if (e === "inf" || e === "+inf")
    return 1 / 0;
  if (e === "nan" || e === "+nan" || e === "-nan")
    return NaN;
  if (e === "-0")
    return i ? 0n : 0;
  let r = K.test(e);
  if (r || X.test(e)) {
    if (Y.test(e))
      throw new c("leading zeroes are not allowed", {
        toml: n,
        ptr: t
      });
    e = e.replace(/_/g, "");
    let l = +e;
    if (isNaN(l))
      throw new c("invalid number", {
        toml: n,
        ptr: t
      });
    if (r) {
      if ((r = !Number.isSafeInteger(l)) && !i)
        throw new c("integer value cannot be represented losslessly", {
          toml: n,
          ptr: t
        });
      (r || i === !0) && (l = BigInt(e));
    }
    return l;
  }
  const f = new S(e);
  if (!f.isValid())
    throw new c("invalid value", {
      toml: n,
      ptr: t
    });
  return f;
}
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
function N(e, n = 0, t = e.length) {
  let i = e.indexOf(`
`, n);
  return e[i - 1] === "\r" && i--, i <= t ? i : -1;
}
function $(e, n) {
  for (let t = n; t < e.length; t++) {
    let i = e[t];
    if (i === `
`)
      return t;
    if (i === "\r" && e[t + 1] === `
`)
      return t + 1;
    if (i < " " && i !== "	" || i === "")
      throw new c("control characters are not allowed in comments", {
        toml: e,
        ptr: n
      });
  }
  return e.length;
}
function k(e, n, t, i) {
  let r;
  for (; ; ) {
    for (; (r = e[n]) === " " || r === "	" || !t && (r === `
` || r === "\r" && e[n + 1] === `
`); )
      n++;
    if (i || r !== "#")
      break;
    n = $(e, n);
  }
  return n;
}
function F(e, n, t, i, r = !1) {
  if (!i)
    return n = N(e, n), n < 0 ? e.length : n;
  for (let f = n; f < e.length; f++) {
    let l = e[f];
    if (l === "#")
      f = N(e, f);
    else {
      if (l === t)
        return f + 1;
      if (l === i || r && (l === `
` || l === "\r" && e[f + 1] === `
`))
        return f;
    }
  }
  throw new c("cannot find end of structure", {
    toml: e,
    ptr: n
  });
}
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
function J(e, n, t) {
  let i = e.slice(n, t), r = i.indexOf("#");
  return r > -1 && ($(e, r), i = i.slice(0, r)), [i.trimEnd(), r];
}
function D(e, n, t, i, r) {
  if (i === 0)
    throw new c("document contains excessively nested structures. aborting.", {
      toml: e,
      ptr: n
    });
  let f = e[n];
  if (f === "[" || f === "{") {
    let [u, o] = f === "[" ? W(e, n, i, r) : Q(e, n, i, r);
    if (t) {
      if (o = k(e, o), e[o] === ",")
        o++;
      else if (e[o] !== t)
        throw new c("expected comma or end of structure", {
          toml: e,
          ptr: o
        });
    }
    return [u, o];
  }
  if (f === '"' || f === "'") {
    let [u, o] = Z(e, n);
    if (t) {
      if (o = k(e, o), e[o] && e[o] !== "," && e[o] !== t && e[o] !== `
` && e[o] !== "\r")
        throw new c("unexpected character encountered", {
          toml: e,
          ptr: o
        });
      e[o] === "," && o++;
    }
    return [u, o];
  }
  let l = F(e, n, ",", t), a = J(e, n, l - (e[l - 1] === "," ? 1 : 0));
  if (!a[0])
    throw new c("incomplete key-value declaration: no value specified", {
      toml: e,
      ptr: n
    });
  return t && a[1] > -1 && (l = k(e, n + a[1]), e[l] === "," && l++), [
    q(a[0], e, n, r),
    l
  ];
}
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
let H = /^[a-zA-Z0-9-_]+[ \t]*$/;
function I(e, n, t = "=") {
  let i = n - 1, r = [], f = e.indexOf(t, n);
  if (f < 0)
    throw new c("incomplete key-value: cannot find end of key", {
      toml: e,
      ptr: n
    });
  do {
    let l = e[n = ++i];
    if (l !== " " && l !== "	")
      if (l === '"' || l === "'") {
        if (l === e[n + 1] && l === e[n + 2])
          throw new c("multiline strings are not allowed in keys", {
            toml: e,
            ptr: n
          });
        let [a, u] = Z(e, n);
        i = e.indexOf(".", u);
        let o = e.slice(u, i < 0 || i > f ? f : i), s = N(o);
        if (s > -1)
          throw new c("newlines are not allowed in keys", {
            toml: e,
            ptr: n + i + s
          });
        if (o.trimStart())
          throw new c("found extra tokens after the string part", {
            toml: e,
            ptr: u
          });
        if (f < u && (f = e.indexOf(t, u), f < 0))
          throw new c("incomplete key-value: cannot find end of key", {
            toml: e,
            ptr: n
          });
        r.push(a);
      } else {
        i = e.indexOf(".", n);
        let a = e.slice(n, i < 0 || i > f ? f : i);
        if (!H.test(a))
          throw new c("only letter, numbers, dashes and underscores are allowed in keys", {
            toml: e,
            ptr: n
          });
        r.push(a.trimEnd());
      }
  } while (i + 1 && i < f);
  return [r, k(e, f + 1, !0, !0)];
}
function Q(e, n, t, i) {
  let r = {}, f = /* @__PURE__ */ new Set(), l;
  for (n++; (l = e[n++]) !== "}" && l; ) {
    if (l === ",")
      throw new c("expected value, found comma", {
        toml: e,
        ptr: n - 1
      });
    if (l === "#")
      n = $(e, n);
    else if (l !== " " && l !== "	" && l !== `
` && l !== "\r") {
      let a, u = r, o = !1, [s, h] = I(e, n - 1);
      for (let T = 0; T < s.length; T++) {
        if (T && (u = o ? u[a] : u[a] = {}), a = s[T], (o = Object.hasOwn(u, a)) && (typeof u[a] != "object" || f.has(u[a])))
          throw new c("trying to redefine an already defined value", {
            toml: e,
            ptr: n
          });
        !o && a === "__proto__" && Object.defineProperty(u, a, { enumerable: !0, configurable: !0, writable: !0 });
      }
      if (o)
        throw new c("trying to redefine an already defined value", {
          toml: e,
          ptr: n
        });
      let [m, g] = D(e, h, "}", t - 1, i);
      f.add(m), u[a] = m, n = g;
    }
  }
  if (!l)
    throw new c("unfinished table encountered", {
      toml: e,
      ptr: n
    });
  return [r, n];
}
function W(e, n, t, i) {
  let r = [], f;
  for (n++; (f = e[n++]) !== "]" && f; ) {
    if (f === ",")
      throw new c("expected value, found comma", {
        toml: e,
        ptr: n - 1
      });
    if (f === "#")
      n = $(e, n);
    else if (f !== " " && f !== "	" && f !== `
` && f !== "\r") {
      let l = D(e, n - 1, "]", t - 1, i);
      r.push(l[0]), n = l[1];
    }
  }
  if (!f)
    throw new c("unfinished array encountered", {
      toml: e,
      ptr: n
    });
  return [r, n];
}
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
function R(e, n, t, i) {
  var o, s;
  let r = n, f = t, l, a = !1, u;
  for (let h = 0; h < e.length; h++) {
    if (h) {
      if (r = a ? r[l] : r[l] = {}, f = (u = f[l]).c, i === 0 && (u.t === 1 || u.t === 2))
        return null;
      if (u.t === 2) {
        let m = r.length - 1;
        r = r[m], f = f[m].c;
      }
    }
    if (l = e[h], (a = Object.hasOwn(r, l)) && ((o = f[l]) == null ? void 0 : o.t) === 0 && ((s = f[l]) != null && s.d))
      return null;
    a || (l === "__proto__" && (Object.defineProperty(r, l, { enumerable: !0, configurable: !0, writable: !0 }), Object.defineProperty(f, l, { enumerable: !0, configurable: !0, writable: !0 })), f[l] = {
      t: h < e.length - 1 && i === 2 ? 3 : i,
      d: !1,
      i: 0,
      c: {}
    });
  }
  if (u = f[l], u.t !== i && !(i === 1 && u.t === 3) || (i === 2 && (u.d || (u.d = !0, r[l] = []), r[l].push(r = {}), u.c[u.i++] = u = { t: 1, d: !1, i: 0, c: {} }), u.d))
    return null;
  if (u.d = !0, i === 1)
    r = a ? r[l] : r[l] = {};
  else if (i === 0 && a)
    return null;
  return [l, r, u.c];
}
function B(e, { maxDepth: n = 1e3, integersAsBigInt: t } = {}) {
  let i = {}, r = {}, f = i, l = r;
  for (let a = k(e, 0); a < e.length; ) {
    if (e[a] === "[") {
      let u = e[++a] === "[", o = I(e, a += +u, "]");
      if (u) {
        if (e[o[1] - 1] !== "]")
          throw new c("expected end of table declaration", {
            toml: e,
            ptr: o[1] - 1
          });
        o[1]++;
      }
      let s = R(
        o[0],
        i,
        r,
        u ? 2 : 1
        /* Type.EXPLICIT */
      );
      if (!s)
        throw new c("trying to redefine an already defined table or value", {
          toml: e,
          ptr: a
        });
      l = s[2], f = s[1], a = o[1];
    } else {
      let u = I(e, a), o = R(
        u[0],
        f,
        l,
        0
        /* Type.DOTTED */
      );
      if (!o)
        throw new c("trying to redefine an already defined table or value", {
          toml: e,
          ptr: a
        });
      let s = D(e, u[1], void 0, n, t);
      o[1][o[0]] = s[0], a = s[1];
    }
    if (a = k(e, a, !0), e[a] && e[a] !== `
` && e[a] !== "\r")
      throw new c("each key-value declaration must be followed by an end-of-line", {
        toml: e,
        ptr: a
      });
    a = k(e, a);
  }
  return i;
}
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
let z = /^[a-z0-9-_]+$/i;
function O(e) {
  let n = typeof e;
  if (n === "object") {
    if (Array.isArray(e))
      return "array";
    if (e instanceof Date)
      return "date";
  }
  return n;
}
function ee(e) {
  for (let n = 0; n < e.length; n++)
    if (O(e[n]) !== "object")
      return !1;
  return e.length != 0;
}
function A(e) {
  return JSON.stringify(e).replace(/\x7f/g, "\\u007f");
}
function P(e, n, t, i) {
  if (t === 0)
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  if (n === "number")
    return isNaN(e) ? "nan" : e === 1 / 0 ? "inf" : e === -1 / 0 ? "-inf" : Number.isInteger(e) && (i || !Number.isSafeInteger(e)) ? e.toFixed(1) : e.toString();
  if (n === "bigint" || n === "boolean")
    return e.toString();
  if (n === "string")
    return A(e);
  if (n === "date") {
    if (isNaN(e.getTime()))
      throw new TypeError("cannot serialize invalid date");
    return e.toISOString();
  }
  if (n === "object")
    return ne(e, t, i);
  if (n === "array")
    return te(e, t, i);
}
function ne(e, n, t) {
  let i = Object.keys(e);
  if (i.length === 0)
    return "{}";
  let r = "{ ";
  for (let f = 0; f < i.length; f++) {
    let l = i[f];
    f && (r += ", "), r += z.test(l) ? l : A(l), r += " = ", r += P(e[l], O(e[l]), n - 1, t);
  }
  return r + " }";
}
function te(e, n, t) {
  if (e.length === 0)
    return "[]";
  let i = "[ ";
  for (let r = 0; r < e.length; r++) {
    if (r && (i += ", "), e[r] === null || e[r] === void 0)
      throw new TypeError("arrays cannot contain null or undefined values");
    i += P(e[r], O(e[r]), n - 1, t);
  }
  return i + " ]";
}
function ie(e, n, t, i) {
  if (t === 0)
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  let r = "";
  for (let f = 0; f < e.length; f++)
    r += `${r && `
`}[[${n}]]
`, r += L(0, e[f], n, t, i);
  return r;
}
function L(e, n, t, i, r) {
  if (i === 0)
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  let f = "", l = "", a = Object.keys(n);
  for (let u = 0; u < a.length; u++) {
    let o = a[u];
    if (n[o] !== null && n[o] !== void 0) {
      let s = O(n[o]);
      if (s === "symbol" || s === "function")
        throw new TypeError(`cannot serialize values of type '${s}'`);
      let h = z.test(o) ? o : A(o);
      if (s === "array" && ee(n[o]))
        l += (l && `
`) + ie(n[o], t ? `${t}.${h}` : h, i - 1, r);
      else if (s === "object") {
        let m = t ? `${t}.${h}` : h;
        l += (l && `
`) + L(m, n[o], m, i - 1, r);
      } else
        f += h, f += " = ", f += P(n[o], s, i, r), f += `
`;
    }
  }
  return e && (f || !l) && (f = f ? `[${e}]
${f}` : `[${e}]`), f && l ? `${f}
${l}` : f || l;
}
function le(e, { maxDepth: n = 1e3, numbersAsFloat: t = !1 } = {}) {
  if (O(e) !== "object")
    throw new TypeError("stringify can only be called with an object");
  let i = L(0, e, "", n, t);
  return i[i.length - 1] !== `
` ? i + `
` : i;
}
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
const fe = { parse: B, stringify: le, TomlDate: S, TomlError: c };
export {
  S as TomlDate,
  c as TomlError,
  fe as default,
  B as parse,
  le as stringify
};
