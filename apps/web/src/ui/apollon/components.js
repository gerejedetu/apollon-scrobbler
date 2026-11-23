// @ts-nocheck: ported as-is from the Apollon design system (components/bundle.js); see apollon.d.ts for the types.
/**
 * The Apollon design system's React components, ported from its bundle: same markup and class names, so
 * components.css (its stylesheet) styles them. Changes from the bundle: an ES module instead of a global,
 * and links go through the router (A) so moving between pages does not reload.
 */
import * as React from "react";
import { A } from "./link.tsx";

var h = React.createElement;
function cx() {
  return Array.prototype.filter.call(arguments, Boolean).join(" ");
}

/* ---------- formatting (French, Last.fm phrasing) ---------- */
var MONTHS_S = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];
var MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];
var WEEKDAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
function fmtNum(n) {
  return n == null ? "" : String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
function plural(n, one, many) {
  return fmtNum(n) + " " + (n > 1 ? many : one);
}
function fmtAgo(ts, now) {
  if (ts == null) return "";
  now = now || Math.floor(Date.now() / 1000);
  var d = Math.max(0, now - ts);
  if (d < 60) return "à l'instant";
  if (d < 3600) return "il y a " + plural(Math.floor(d / 60), "minute", "minutes");
  if (d < 86400) return "il y a " + plural(Math.floor(d / 3600), "heure", "heures");
  var dt = new Date(ts * 1000);
  return (
    dt.getDate() +
    " " +
    MONTHS_S[dt.getMonth()] +
    " " +
    String(dt.getHours()).padStart(2, "0") +
    "h" +
    String(dt.getMinutes()).padStart(2, "0")
  );
}
function dayKey(ts) {
  var d = new Date(ts * 1000);
  return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
}
function fmtDay(ts, now) {
  now = now || Math.floor(Date.now() / 1000);
  if (dayKey(ts) === dayKey(now)) return "Aujourd'hui";
  if (dayKey(ts) === dayKey(now - 86400)) return "Hier";
  var d = new Date(ts * 1000);
  return (
    WEEKDAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear()
  );
}
function fmtDate(ts) {
  var d = new Date(ts * 1000);
  return d.getDate() + " " + MONTHS_S[d.getMonth()] + " " + d.getFullYear();
}

/* ---------- icons: 16 grid, 1.5 stroke, currentColor ---------- */
function Icon(p) {
  return h(
    "svg",
    {
      className: "ap-icon",
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.5,
      strokeLinejoin: "round",
      "aria-hidden": "true",
    },
    p.children,
  );
}
var icons = {
  heart: function (on) {
    return h(
      Icon,
      null,
      h("path", {
        d: "M8 13.6 2.7 8.4a3.1 3.1 0 0 1 5.3-3.8 3.1 3.1 0 0 1 5.3 3.8Z",
        fill: on ? "currentColor" : "none",
      }),
    );
  },
  play: function () {
    return h(Icon, null, h("path", { d: "M5 3v10l8.5-5Z", fill: "currentColor", stroke: "none" }));
  },
  search: function () {
    return h(
      Icon,
      null,
      h("circle", { cx: 7, cy: 7, r: 4.5 }),
      h("path", { d: "m10.5 10.5 3.5 3.5" }),
    );
  },
  chevron: function () {
    return h(Icon, null, h("path", { d: "m4.5 6.5 3.5 3.5 3.5-3.5" }));
  },
  arrow: function () {
    return h(Icon, null, h("path", { d: "M3 8h10M9 4l4 4-4 4" }));
  },
  more: function () {
    return h(Icon, null, h("path", { d: "m6 4 4 4-4 4" }));
  },
  note: function () {
    return h(
      Icon,
      null,
      h("path", { d: "M6 12V3.5l7-1.5V10" }),
      h("circle", { cx: 4.5, cy: 12, r: 1.8 }),
      h("circle", { cx: 11.5, cy: 10.5, r: 1.8 }),
    );
  },
  history: function () {
    return h(
      Icon,
      null,
      h("path", { d: "M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5v2.5H5M8 5v3l2 1.5" }),
    );
  },
  star: function () {
    return h(
      Icon,
      null,
      h("path", { d: "m8 2 1.8 3.9 4.2.5-3.1 2.9.8 4.2L8 11.4l-3.7 2.1.8-4.2L2 6.4l4.2-.5Z" }),
    );
  },
  disc: function () {
    return h(
      Icon,
      null,
      h("circle", { cx: 8, cy: 8, r: 6 }),
      h("circle", { cx: 8, cy: 8, r: 1.6 }),
    );
  },
  up: function () {
    return h(Icon, null, h("path", { d: "M8 13V3.5M4 7.5l4-4 4 4" }));
  },
  down: function () {
    return h(Icon, null, h("path", { d: "M8 3v9.5M4 8.5l4 4 4-4" }));
  },
  flat: function () {
    return h(Icon, null, h("path", { d: "M3 8h10" }));
  },
  trash: function () {
    return h(Icon, null, h("path", { d: "M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5" }));
  },
  dots: function () {
    return h(
      Icon,
      null,
      h("path", { d: "M8 3.5v.01M8 8v.01M8 12.5v.01", strokeWidth: 2.5, strokeLinecap: "round" }),
    );
  },
  target: function () {
    return h(
      Icon,
      null,
      h("rect", { x: 2.5, y: 2.5, width: 11, height: 11 }),
      h("rect", { x: 6, y: 6, width: 4, height: 4, fill: "currentColor", stroke: "none" }),
    );
  },
  globe: function () {
    return h(
      Icon,
      null,
      h("circle", { cx: 8, cy: 8, r: 5.8 }),
      h("path", { d: "M2.2 8h11.6M8 2.2c1.8 2 1.8 9.6 0 11.6M8 2.2c-1.8 2-1.8 9.6 0 11.6" }),
    );
  },
  external: function () {
    return h(Icon, null, h("path", { d: "M9 3h4v4M13 3 7.5 8.5M11 9.5V13H3V5h3.5" }));
  },
  flame: function () {
    return h(
      Icon,
      null,
      h("path", {
        d: "M8 14c2.5 0 4-1.6 4-3.8C12 7 9 6 9 2.5 6.5 4 6 6 6.3 7.5 5.4 7.2 5 6.4 5 5.6 4.3 6.5 4 7.6 4 10.2 4 12.4 5.5 14 8 14Z",
      }),
    );
  },
  flag: function () {
    return h(Icon, null, h("path", { d: "M3.5 14V2.5h8l-1.5 3 1.5 3h-8" }));
  },
  calendar: function () {
    return h(
      Icon,
      null,
      h("rect", { x: 2.5, y: 3.5, width: 11, height: 10 }),
      h("path", { d: "M2.5 6.5h11M5.5 2v3M10.5 2v3" }),
    );
  },
  check: function () {
    return h(Icon, null, h("path", { d: "m3 8.5 3 3 7-7" }));
  },
  close: function () {
    return h(Icon, null, h("path", { d: "m4 4 8 8M12 4l-8 8" }));
  },
  info: function () {
    return h(
      Icon,
      null,
      h("circle", { cx: 8, cy: 8, r: 5.8 }),
      h("path", { d: "M8 7.2V11M8 5v.01" }),
    );
  },
  left: function () {
    return h(Icon, null, h("path", { d: "m10 4-4 4 4 4" }));
  },
  plus: function () {
    return h(Icon, null, h("path", { d: "M8 3v10M3 8h10" }));
  },
  user: function () {
    return h(
      Icon,
      null,
      h("rect", { x: 5, y: 2.5, width: 6, height: 6 }),
      h("path", { d: "M2.5 14c.5-3 2.6-4.5 5.5-4.5s5 1.5 5.5 4.5" }),
    );
  },
  menu: function () {
    return h(Icon, null, h("path", { d: "M2.5 4h11M2.5 8h11M2.5 12h11" }));
  },
  chart: function () {
    return h(Icon, null, h("path", { d: "M3 13.5V8M6.5 13.5V3M10 13.5V6.5M13.5 13.5v-4" }));
  },
  laurel: function () {
    return h(
      Icon,
      null,
      h("path", {
        d: "M5 13.5 3 4M11 13.5 13 4M5.5 13.5h5M2 6.5l2.2-1.2M2.8 9.6 4.9 8.6M14 6.5l-2.2-1.2M13.2 9.6l-2.1-1",
      }),
    );
  },
};

/* ---------- generative art: a stable picture per name, rectangles only ---------- */
function hashStr(str) {
  var x = 2166136261;
  str = String(str || "");
  for (var i = 0; i < str.length; i++) {
    x ^= str.charCodeAt(i);
    x = Math.imul(x, 16777619) >>> 0;
  }
  return x;
}
var GEN_PAL = [
  ["--report-surface", "--cat-artists", "--cat-tracks"],
  ["--cat-artists", "--cat-ink", "--band"],
  ["--cat-tracks", "--cat-ink", "--cat-artists"],
  ["--cat-albums", "--cat-ink", "--band"],
  ["--band", "--cat-ink", "--cat-albums"],
  ["--cat-ink", "--cat-albums", "--cat-tracks"],
  ["--band-prev", "--band", "--cat-ink"],
];
function GenArt(p) {
  var x = hashStr(p.seed),
    pal = GEN_PAL[x % GEN_PAL.length],
    kind = p.kind != null ? p.kind : (x >>> 3) % 5;
  var bit = function (n) {
      return (x >>> n) & 1;
    },
    num = function (n, m) {
      return (x >>> n) % m;
    };
  var f = function (v) {
    return { fill: "var(" + v + ")" };
  };
  var k = [h("rect", { key: "g", x: 0, y: 0, width: 100, height: 100, style: f(pal[0]) })];
  if (kind === 0) {
    /* count bars */
    for (var i = 0; i < 5; i++) {
      var hh = 20 + num(i * 5, 60);
      k.push(
        h("rect", {
          key: i,
          x: 12 + i * 16,
          y: 88 - hh,
          width: 11,
          height: hh,
          style: f(i === num(2, 5) ? pal[2] : pal[1]),
        }),
      );
    }
  } else if (kind === 1) {
    /* blocks */
    var a = 30 + num(4, 30),
      b = 20 + num(9, 25);
    k.push(
      h("rect", {
        key: "a",
        x: num(13, 30),
        y: num(17, 30),
        width: a + 20,
        height: a + 20,
        style: f(pal[1]),
      }),
    );
    k.push(
      h("rect", {
        key: "b",
        x: 40 + num(21, 25),
        y: 40 + num(25, 25),
        width: b,
        height: b,
        style: f(pal[2]),
      }),
    );
  } else if (kind === 2) {
    /* grid */
    for (var r = 0; r < 4; r++)
      for (var c = 0; c < 4; c++) {
        var n = r * 4 + c;
        if (bit(n % 31) || n === num(7, 16))
          k.push(
            h("rect", {
              key: n,
              x: 8 + c * 22,
              y: 8 + r * 22,
              width: 18,
              height: 18,
              style: f(n === num(7, 16) ? pal[2] : pal[1]),
            }),
          );
      }
  } else if (kind === 3) {
    /* stripes */
    var yy = 6;
    for (var j = 0; yy < 94; j++) {
      var t = 4 + num(j * 3, 12);
      k.push(
        h("rect", {
          key: j,
          x: 0,
          y: yy,
          width: 100,
          height: t,
          style: f(j === 2 ? pal[2] : pal[1]),
        }),
      );
      yy += t + 4 + num(j * 3 + 1, 8);
    }
  } else {
    /* sunrise: horizontal bars like the system motif */
    for (var q = 0; q < 6; q++) {
      var w = 92 - q * (8 + num(q * 4, 8));
      k.push(
        h("rect", {
          key: q,
          x: 4,
          y: 90 - (q + 1) * 14,
          width: Math.max(10, w),
          height: 10,
          style: f(q === 0 ? pal[2] : pal[1]),
        }),
      );
    }
  }
  return h(
    "svg",
    {
      className: p.className,
      viewBox: "0 0 100 100",
      preserveAspectRatio: "xMidYMid slice",
      "aria-hidden": "true",
      style: p.style,
    },
    k,
  );
}
/* An image that gives way to `fallback` (the generated cover) when it fails to load: the app's /covers
   answers 404 for a sleeve nobody has. */
function Img(p) {
  var st = React.useState(false);
  if (!p.src || st[0]) return p.fallback || null;
  return h("img", {
    className: p.className,
    src: p.src,
    alt: "",
    loading: "lazy",
    onError: function () {
      st[1](true);
    },
  });
}
function Cover(p) {
  var fallback = p.seed
    ? h(GenArt, { className: "ap-cover", seed: p.seed })
    : h("div", { className: "ap-cover", "aria-hidden": "true" }, icons.note());
  return p.src ? h(Img, { className: "ap-cover", src: p.src, fallback: fallback }) : fallback;
}
function Avatar(p) {
  if (p.src) return h("img", { className: "ap-avatar", src: p.src, alt: "" });
  return h(
    "div",
    { className: "ap-avatar", "aria-hidden": "true" },
    (p.name || "?").charAt(0).toUpperCase(),
  );
}

/* ---------- chrome ---------- */
/* The profile banner drawn by the listening hours: 24 columns rising like a sunrise, the peak hour in gold. */
function ListeningBanner(p) {
  var hrs = p.hours || [],
    max = Math.max.apply(null, hrs.concat([1])),
    peak = hrs.indexOf(max),
    W = 1440,
    H = 300,
    bw = W / 24;
  return h(
    "svg",
    {
      className: "ap-lbanner",
      viewBox: "0 0 " + W + " " + H,
      preserveAspectRatio: "none",
      "aria-hidden": "true",
    },
    hrs.map(function (v, i) {
      var hh = Math.max(4, (v / max) * H * 0.86);
      return h("rect", {
        key: i,
        className: i === peak ? "is-peak" : "",
        x: i * bw + 3,
        y: H - hh,
        width: bw - 6,
        height: hh,
      });
    }),
    h("rect", { className: "ap-lbanner__line", x: 0, y: H - 2, width: W, height: 2 }),
  );
}
function SiteHeader(p) {
  var links = p.links || [
    { label: "Musique", href: "#" },
    { label: "Graphiques", href: "#" },
  ];
  return h(
    "header",
    { className: "ap-root ap-site" },
    h(
      "button",
      { type: "button", className: "ap-site__burger", "aria-label": "Menu", onClick: p.onMenu },
      icons.menu(),
    ),
    p.brand ? h(A, { className: "ap-site__mark", href: p.homeHref || "#" }, p.brand) : null,
    h(
      "nav",
      { className: "ap-site__links", "aria-label": "Navigation principale" },
      links.map(function (l, i) {
        return h(
          A,
          { key: i, href: l.href, "aria-current": l.current ? "page" : undefined },
          l.label,
        );
      }),
    ),
    h(
      "div",
      { className: "ap-site__nav" },
      h(
        "button",
        {
          type: "button",
          className: "ap-site__icon",
          "aria-label": "Rechercher",
          onClick: p.onSearch,
        },
        icons.search(),
      ),
      p.visitor
        ? [
            h(
              A,
              { key: "in", href: p.loginHref || "#", className: "ap-site__login" },
              "Se connecter",
            ),
            p.signupOpen !== false
              ? h(
                  A,
                  {
                    key: "up",
                    href: p.signupHref || "#",
                    className: "ap-btn ap-btn--primary ap-btn--sm",
                  },
                  "Créer un compte",
                )
              : null,
          ]
        : p.accountHref
          ? h(
              A,
              { href: p.accountHref, className: "ap-site__account", "aria-label": p.accountLabel },
              h(Avatar, { name: p.userName, src: p.avatarUrl }),
            )
          : h(Avatar, { name: p.userName, src: p.avatarUrl }),
    ),
  );
}

var PROFILE_TABS = [
  "Aperçu",
  "Rapports",
  "Bibliothèque",
  "Coups de cœur",
  "Obsessions",
  "Lauriers",
];
function ProfileHeader(p) {
  var tabs = p.tabs || PROFILE_TABS;
  var active = p.activeTab || tabs[0];
  var t = p.topTrack;
  return h(
    "section",
    { className: "ap-root ap-banner" },
    p.imageUrl
      ? h("div", {
          className: "ap-banner__img",
          style: { backgroundImage: 'url("' + p.imageUrl + '")' },
        })
      : p.hours
        ? h(ListeningBanner, { hours: p.hours })
        : null,
    h(
      "div",
      { className: "ap-banner__inner" },
      h(
        "div",
        { className: "ap-banner__main" },
        h(
          "div",
          { className: "ap-banner__who" },
          h(Avatar, { name: p.userName, src: p.avatarUrl }),
          h(
            "div",
            null,
            h("div", { className: "ap-banner__name" }, p.userName),
            p.createdAt
              ? h(
                  "div",
                  { className: "ap-banner__since" },
                  p.userName + " scrobble depuis le " + fmtDate(p.createdAt),
                )
              : null,
          ),
        ),
        h(
          "nav",
          { className: "ap-banner__tabs" },
          tabs.map(function (tab) {
            // A tab is a label (the design's buttons) or { label, href } (a page of the profile).
            if (typeof tab === "object")
              return h(
                A,
                {
                  key: tab.href,
                  href: tab.href,
                  className: "ap-banner__tab",
                  "aria-current": tab.label === active ? "page" : undefined,
                },
                tab.label,
              );
            return h(
              "button",
              {
                key: tab,
                type: "button",
                className: "ap-banner__tab",
                "aria-current": tab === active ? "page" : undefined,
                onClick: function () {
                  if (p.onTab) p.onTab(tab);
                },
              },
              tab,
            );
          }),
        ),
      ),
      t
        ? h(
            "div",
            { className: "ap-banner__top" },
            h(
              "div",
              null,
              h("div", { className: "ap-label" }, p.topLabel || "Top titre"),
              h("div", { className: "ap-banner__toptitle" }, t.track),
              h("div", { className: "ap-banner__topartist" }, t.artist),
            ),
            h(
              "div",
              { className: "ap-banner__coverwrap" },
              h(Cover, { src: p.topTrackCoverUrl, seed: t.album || t.artist || t.track }),
              p.onTopPlay
                ? h(
                    "button",
                    {
                      type: "button",
                      className: "ap-banner__play",
                      "aria-label": "Écouter " + t.track,
                      onClick: p.onTopPlay,
                    },
                    icons.play(),
                  )
                : null,
            ),
          )
        : null,
    ),
  );
}

function StatInline(p) {
  return h(
    "div",
    { className: "ap-root ap-stats" },
    (p.stats || []).map(function (s, i) {
      return h(
        "div",
        { key: i },
        h("div", { className: "ap-label" }, s.label),
        h(
          "div",
          { className: "ap-stats__value" },
          typeof s.value === "number" ? fmtNum(s.value) : s.value,
          s.trend
            ? h(
                "span",
                { style: { marginLeft: "8px", verticalAlign: "middle" } },
                h(TrendBadge, s.trend),
              )
            : null,
        ),
      );
    }),
  );
}

/* ---------- controls ---------- */
function Button(p) {
  return h(
    "button",
    {
      type: p.type || "button",
      className: cx(
        "ap-btn",
        "ap-btn--" + (p.variant || "primary"),
        p.size === "sm" && "ap-btn--sm",
      ),
      disabled: p.disabled,
      onClick: p.onClick,
      "aria-label": p["aria-label"],
    },
    p.icon && icons[p.icon] ? icons[p.icon]() : null,
    p.children,
  );
}
function PlayButton(p) {
  return h(
    "button",
    { type: "button", className: "ap-play", "aria-label": p.label || "Lire", onClick: p.onClick },
    icons.play(),
  );
}
function LoveButton(p) {
  var on = !!p.loved;
  return h(
    "button",
    {
      type: "button",
      className: "ap-love",
      "aria-pressed": on ? "true" : "false",
      "aria-label": on ? "Retirer des coups de cœur" : "Ajouter aux coups de cœur",
      onClick: function () {
        if (p.onToggle) p.onToggle(!on);
      },
    },
    icons.heart(on),
  );
}

var LIB_TABS = [
  { value: "listens", label: "Scrobbles", icon: "history" },
  { value: "artists", label: "Artistes", icon: "star" },
  { value: "releases", label: "Albums", icon: "disc" },
  { value: "recordings", label: "Titres", icon: "note" },
];
function LibraryTabs(p) {
  var tabs = p.tabs || LIB_TABS;
  var st = React.useState(p.defaultValue || tabs[0].value);
  var value = p.value != null ? p.value : st[0];
  return h(
    "div",
    { className: "ap-root ap-tabs", role: "tablist" },
    tabs.map(function (t) {
      return h(
        "button",
        {
          key: t.value,
          type: "button",
          role: "tab",
          className: "ap-tab",
          "aria-selected": t.value === value ? "true" : "false",
          onClick: function () {
            st[1](t.value);
            if (p.onChange) p.onChange(t.value);
          },
        },
        t.icon && icons[t.icon] ? icons[t.icon]() : null,
        t.label,
      );
    }),
  );
}

var PERIODS = [
  { value: "week", label: "7 derniers jours" },
  { value: "month", label: "30 derniers jours" },
  { value: "quarter", label: "90 derniers jours" },
  { value: "year", label: "365 derniers jours" },
  { value: "all_time", label: "Depuis le début" },
];
function SectionHeader(p) {
  var periods = p.periods || PERIODS;
  var st = React.useState(p.defaultPeriod || periods[0].value);
  var value = p.period != null ? p.period : st[0];
  var cur =
    periods.filter(function (x) {
      return x.value === value;
    })[0] || periods[0];
  return h(
    "div",
    { className: cx("ap-root ap-sechead", p.size === "sm" && "ap-sechead--sm") },
    h("h2", { className: "ap-sechead__title" }, p.title),
    p.showPeriod === false
      ? null
      : h(
          "label",
          { className: "ap-period" },
          cur.label,
          icons.chevron(),
          h(
            "select",
            {
              value: value,
              "aria-label": "Période",
              onChange: function (e) {
                st[1](e.target.value);
                if (p.onPeriodChange) p.onPeriodChange(e.target.value);
              },
            },
            periods.map(function (x) {
              return h("option", { key: x.value, value: x.value }, x.label);
            }),
          ),
        ),
    p.actions ? h("span", { className: "ap-sechead__sep" }) : null,
    p.actions || null,
  );
}
function MoreLink(p) {
  return h(
    "div",
    { className: "ap-sechead__more" },
    h(A, { className: "ap-link", href: p.href || "#" }, p.children, icons.more()),
  );
}

/* Text made of linked parts ("Sickboyrari & Krisu": two artists, two links), or the plain text. */
function linkParts(parts, text) {
  if (!parts) return text;
  return parts.map(function (part, i) {
    return part.href
      ? h(A, { key: i, href: part.href, className: "ap-row__link" }, part.text)
      : h(React.Fragment, { key: i }, part.text);
  });
}

/* ---------- listens ---------- */
function TrackRow(p) {
  var l = p.listen || {};
  var now = !!p.nowPlaying;
  return h(
    "div",
    { className: cx("ap-root ap-row", now && "ap-row--now", p.trailing && "ap-row--trail") },
    p.playHref
      ? h(
          "a",
          {
            className: "ap-play",
            href: p.playHref,
            target: "_blank",
            rel: "noopener",
            "aria-label": "Lire " + l.track,
          },
          icons.play(),
        )
      : h(PlayButton, { onClick: p.onPlay, label: "Lire " + l.track }),
    h(Cover, { src: p.coverUrl, seed: l.album || l.artist || l.track }),
    p.readOnly
      ? p.loved
        ? h(
            "span",
            {
              className: "ap-love",
              "aria-label": "Coup de cœur",
              style: { color: "var(--gold-text)", cursor: "default" },
            },
            icons.heart(true),
          )
        : h("span", { className: "ap-love", "aria-hidden": "true" })
      : h(LoveButton, { loved: p.loved, onToggle: p.onToggleLove }),
    p.titleHref
      ? h(A, { className: "ap-row__title", title: l.track, href: p.titleHref }, l.track)
      : h("div", { className: "ap-row__title", title: l.track }, l.track),
    h("div", { className: "ap-row__artist", title: l.artist }, linkParts(p.artistLinks, l.artist)),
    now
      ? h(
          "div",
          { className: "ap-row__time" },
          h("span", { className: "ap-eq", "aria-hidden": "true" }, h("i"), h("i"), h("i")),
          "En cours d'écoute",
        )
      : h("div", { className: "ap-row__time" }, fmtAgo(l.listenedAt, p.now)),
    p.trailing ? h("div", { className: "ap-row__trail" }, p.trailing) : null,
  );
}
function TrackList(p) {
  var out = [],
    last = null;
  if (p.nowPlaying)
    out.push(
      h(TrackRow, {
        key: "np",
        listen: p.nowPlaying,
        nowPlaying: true,
        coverUrl: p.nowPlayingCoverUrl || (p.coverFor ? p.coverFor(p.nowPlaying) : undefined),
        titleHref: p.titleHref ? p.titleHref(p.nowPlaying) : undefined,
        artistLinks: p.artistLinks ? p.artistLinks(p.nowPlaying) : undefined,
        playHref: p.playHref ? p.playHref(p.nowPlaying) : undefined,
        readOnly: p.readOnly,
        loved: p.isLoved ? p.isLoved(p.nowPlaying) : false,
        onToggleLove: p.onToggleLove
          ? function (next) {
              p.onToggleLove(p.nowPlaying, next);
            }
          : undefined,
      }),
    );
  (p.listens || []).forEach(function (l) {
    if (p.groupByDay) {
      var k = dayKey(l.listenedAt);
      if (k !== last) {
        out.push(h("div", { key: "d" + k, className: "ap-day" }, fmtDay(l.listenedAt, p.now)));
        last = k;
      }
    }
    out.push(
      h(TrackRow, {
        key: l.id,
        listen: l,
        now: p.now,
        readOnly: p.readOnly,
        loved: p.isLoved ? p.isLoved(l) : false,
        coverUrl: p.coverFor ? p.coverFor(l) : undefined,
        titleHref: p.titleHref ? p.titleHref(l) : undefined,
        artistLinks: p.artistLinks ? p.artistLinks(l) : undefined,
        playHref: p.playHref ? p.playHref(l) : undefined,
        trailing: p.trailing ? p.trailing(l) : undefined,
        onToggleLove: p.onToggleLove
          ? function (next) {
              p.onToggleLove(l, next);
            }
          : undefined,
      }),
    );
  });
  return h("div", { className: "ap-root" }, out);
}

/* ---------- stats ---------- */
function TopChart(p) {
  var items = p.items || [];
  var entity = p.entity || "recordings";
  var max =
    items.reduce(function (m, i) {
      return Math.max(m, i.listenCount || 0);
    }, 0) || 1;
  var unit = p.unit || "scrobbles";
  return h(
    "ol",
    { className: "ap-root ap-chart" },
    items.map(function (it, i) {
      var title = entity === "artists" ? it.artist : entity === "releases" ? it.album : it.track;
      return h(
        "li",
        { key: i, className: "ap-chart__row" },
        h("span", { className: "ap-chart__rank" }, (p.offset || 0) + i + 1),
        h(Cover, {
          src: p.coverFor ? p.coverFor(it) : undefined,
          seed: it.album || it.artist || title,
        }),
        p.readOnly
          ? h("span", { className: "ap-love", "aria-hidden": "true" })
          : h(LoveButton, {
              loved: p.isLoved ? p.isLoved(it) : false,
              onToggle: p.onToggleLove
                ? function (next) {
                    p.onToggleLove(it, next);
                  }
                : undefined,
            }),
        h(
          "div",
          { style: { minWidth: 0 } },
          p.hrefFor
            ? h(A, { className: "ap-chart__title", href: p.hrefFor(it) }, title)
            : h("div", { className: "ap-chart__title" }, title),
          entity === "artists"
            ? null
            : h(
                "div",
                { className: "ap-chart__artist" },
                linkParts(p.artistLinks ? p.artistLinks(it) : null, it.artist),
              ),
        ),
        h(
          "div",
          { className: "ap-chart__bar" },
          h(
            "span",
            { style: { width: Math.max(12, (it.listenCount / max) * 100) + "%" } },
            i === 0 ? fmtNum(it.listenCount) + " " + unit : fmtNum(it.listenCount),
          ),
        ),
      );
    }),
  );
}

function ArtworkGrid(p) {
  var items = (p.items || []).slice(0, 5);
  return h(
    "div",
    { className: "ap-root ap-mosaic" },
    items.map(function (it, i) {
      return h(
        A,
        { key: i, className: "ap-tile", href: it.href || "#" },
        h(Img, {
          src: it.imageUrl,
          fallback: h(GenArt, { className: "ap-tile__gen", seed: it.name }),
        }),
        h("div", { className: "ap-tile__scrim" }),
        h(
          "div",
          { className: "ap-tile__text" },
          h("div", { className: "ap-tile__name" }, it.name),
          it.sub ? h("div", { className: "ap-tile__sub" }, it.sub) : null,
          it.listenCount != null
            ? h("div", { className: "ap-tile__sub" }, plural(it.listenCount, "écoute", "écoutes"))
            : null,
        ),
      );
    }),
  );
}

/* ---------- cards ---------- */
var ART = {
  obsession: function () {
    return h(
      "svg",
      { className: "ap-card__art", viewBox: "0 0 120 120", "aria-hidden": "true" },
      h("rect", {
        className: "s-gold",
        x: 6,
        y: 6,
        width: 108,
        height: 108,
        fill: "none",
        strokeWidth: 1,
      }),
      h("rect", {
        className: "s-gold",
        x: 22,
        y: 22,
        width: 76,
        height: 76,
        fill: "none",
        strokeWidth: 1.5,
      }),
      h("rect", { className: "f-tint", x: 38, y: 38, width: 44, height: 44 }),
      h("path", {
        className: "s-ink",
        d: "m55 52 13 13M52 68l7-7M62 50l8 8-3 3-8-8Z",
        fill: "none",
        strokeWidth: 2,
      }),
    );
  },
  discover: function () {
    var rays = [];
    for (var a = 0; a < 12; a++) {
      var r = (a * Math.PI) / 6;
      rays.push(
        h("line", {
          key: a,
          className: "s-gold",
          x1: 60 + Math.cos(r) * 34,
          y1: 60 + Math.sin(r) * 34,
          x2: 60 + Math.cos(r) * 52,
          y2: 60 + Math.sin(r) * 52,
          strokeWidth: 1.5,
        }),
      );
    }
    return h(
      "svg",
      { className: "ap-card__art", viewBox: "0 0 120 120", "aria-hidden": "true" },
      rays,
      h("rect", { className: "f-gold", x: 40, y: 40, width: 40, height: 40 }),
    );
  },
  report: function () {
    return h(
      "svg",
      { className: "ap-card__art", viewBox: "0 0 120 120", "aria-hidden": "true" },
      [30, 52, 40, 76, 58, 92].map(function (v, i) {
        return h("rect", {
          key: i,
          className: i === 5 ? "f-gold" : "f-tint",
          x: 10 + i * 17,
          y: 110 - v,
          width: 13,
          height: v,
        });
      }),
    );
  },
};
function ActionCard(p) {
  return h(
    "div",
    {
      className: "ap-root ap-card",
      role: p.onClick ? "button" : undefined,
      tabIndex: p.onClick ? 0 : undefined,
      onClick: p.onClick,
      style: p.onClick ? { cursor: "pointer" } : undefined,
    },
    h(
      "div",
      { className: "ap-card__body" },
      h("div", { className: "ap-card__title" }, p.title),
      p.hint ? h("div", { className: "ap-card__hint" }, p.hint) : null,
    ),
    ART[p.art || "obsession"] ? ART[p.art || "obsession"]() : null,
  );
}
function ObsessionCard(p) {
  var o = p.obsession;
  if (!o)
    return h(ActionCard, {
      title: "Définir une nouvelle obsession",
      hint: "Le titre qui vous suit en ce moment.",
      art: "obsession",
      onClick: p.onSet,
    });
  return h(
    "div",
    { className: "ap-root ap-card ap-card--obs" },
    h(Cover, { src: p.coverUrl, seed: o.album || o.artist }),
    h(
      "div",
      { className: "ap-card__body" },
      h(
        "div",
        { className: "ap-label" },
        p.userName ? "L'obsession de " + p.userName : "Votre obsession",
      ),
      h("div", { className: "ap-card__title", style: { marginTop: "4px" } }, o.track),
      h("div", { style: { fontSize: "16px", lineHeight: "22px" } }, o.artist),
      o.since ? h("div", { className: "ap-card__since" }, "depuis le " + fmtDate(o.since)) : null,
    ),
    p.onClear
      ? h(Button, { variant: "secondary", size: "sm", onClick: p.onClear }, "Retirer")
      : null,
  );
}
function ReportCard(p) {
  var bars = p.bars || [];
  var max = Math.max.apply(null, bars.concat([1]));
  return h(
    A,
    { className: "ap-root ap-report", href: p.href || "#" },
    h(
      "div",
      null,
      h("div", { className: "ap-report__title" }, p.title, icons.arrow()),
      h("div", { className: "ap-report__sub" }, p.subtitle),
    ),
    h(
      "div",
      { className: "ap-report__bars", "aria-hidden": "true" },
      bars.map(function (v, i) {
        return h("span", {
          key: i,
          className: i === bars.length - 1 ? "is-cur" : "",
          style: { height: Math.max(4, (v / max) * 52) + "px" },
        });
      }),
    ),
  );
}

var DAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
function ClockHeatmap(p) {
  var grid = p.heatmap || [],
    max = 0;
  grid.forEach(function (r) {
    r.forEach(function (v) {
      if (v > max) max = v;
    });
  });
  max = max || 1;
  var cells = [h("span", { key: "c" })];
  for (var hr = 0; hr < 24; hr++)
    cells.push(
      h("span", { key: "h" + hr, className: "ap-heat__hour" }, hr % 6 === 0 ? hr + "h" : ""),
    );
  grid.forEach(function (row, d) {
    cells.push(h("span", { key: "d" + d, className: "ap-heat__day" }, DAYS[d]));
    row.forEach(function (v, x) {
      cells.push(
        h(
          "span",
          {
            key: d + "-" + x,
            className: "ap-heat__cell",
            title: DAYS[d] + " " + x + "h : " + plural(v, "écoute", "écoutes"),
          },
          v > 0 ? h("span", { style: { opacity: 0.15 + (0.85 * v) / max } }) : null,
        ),
      );
    });
  });
  return h(
    "div",
    { className: "ap-root" },
    h(
      "div",
      { className: "ap-heat", role: "img", "aria-label": "Écoutes par jour et par heure" },
      cells,
    ),
    h(
      "div",
      { className: "ap-legend" },
      "moins",
      [0, 0.25, 0.5, 0.75, 1].map(function (f, i) {
        return h(
          "span",
          { key: i, className: "ap-heat__cell" },
          f ? h("span", { style: { opacity: 0.15 + 0.85 * f } }) : null,
        );
      }),
      "plus",
    ),
  );
}

function TrendBadge(p) {
  var dir = p.direction || (p.delta > 0 ? "up" : p.delta < 0 ? "down" : "flat");
  if (dir === "new")
    return h("span", { className: "ap-root ap-trend ap-trend--new" }, p.label || "Nouveau");
  var label =
    p.label ||
    (p.delta != null
      ? (p.delta > 0 ? "+" : p.delta < 0 ? "−" : "") + Math.abs(p.delta) + " %"
      : "");
  return h("span", { className: "ap-root ap-trend ap-trend--" + dir }, icons[dir](), label);
}

/* =================== Layout =================== */
function Page(p) {
  return h("div", { className: "ap-root ap-page" }, p.children);
}
function Columns(p) {
  return h(
    "div",
    { className: "ap-root ap-cols" },
    h("div", { className: "ap-stack" }, p.main),
    h("aside", { className: cx("ap-stack", p.underCover && "ap-under-cover") }, p.side),
  );
}

function IconButton(p) {
  return h(
    "button",
    {
      type: "button",
      className: "ap-iconbtn",
      "aria-label": p.label,
      "aria-pressed": p.pressed != null ? String(!!p.pressed) : undefined,
      onClick: p.onClick,
    },
    icons[p.icon] ? icons[p.icon](p.icon === "heart" && p.pressed) : null,
  );
}

/* =================== Detail pages =================== */
var KIND_PLAY = { artist: "Écouter l'artiste", album: "Lire l'album", track: "Écouter le titre" };
function EntityHero(p) {
  var kind = p.kind || "artist";
  return h(
    "section",
    {
      className: cx(
        "ap-root ap-hero",
        p.coverUrl !== false && kind !== "artist" && "ap-hero--cover",
      ),
    },
    p.imageUrl
      ? h("div", {
          className: "ap-hero__img",
          style: { backgroundImage: 'url("' + p.imageUrl + '")' },
        })
      : h(GenArt, { className: "ap-hero__gen", seed: (p.artist || "") + p.title, kind: 0 }),
    h(
      "div",
      { className: "ap-hero__inner" },
      kind !== "artist" && p.artist
        ? h(A, { className: "ap-hero__eyebrow", href: p.artistHref || "#" }, p.artist)
        : null,
      h("h1", { className: "ap-hero__title" }, p.title),
      h(
        "div",
        { className: "ap-hero__bar" },
        p.rank ? h("span", { className: "ap-hero__rank" }, "#" + p.rank) : null,
        p.actions !== undefined
          ? p.actions
          : [
              h(
                Button,
                { key: "p", variant: "light", icon: "play", onClick: p.onPlay },
                KIND_PLAY[kind],
              ),
              kind === "track"
                ? h(IconButton, {
                    key: "l",
                    icon: "heart",
                    label: p.loved ? "Retirer des coups de cœur" : "Ajouter aux coups de cœur",
                    pressed: !!p.loved,
                    onClick: p.onToggleLove,
                  })
                : null,
              kind === "track"
                ? h(IconButton, {
                    key: "o",
                    icon: "target",
                    label: "Définir comme obsession",
                    pressed: !!p.isObsession,
                    onClick: p.onObsession,
                  })
                : null,
              h(IconButton, { key: "m", icon: "dots", label: "Plus d'actions", onClick: p.onMore }),
            ],
        (p.stats || []).length
          ? h(
              "div",
              { className: "ap-hero__stats" },
              p.stats.map(function (s, i) {
                return h(
                  "div",
                  { key: i },
                  h("div", { className: "ap-hero__k" }, s.label),
                  h(
                    "div",
                    { className: "ap-hero__v" },
                    typeof s.value === "number" ? fmtNum(s.value) : s.value,
                  ),
                );
              }),
            )
          : null,
      ),
    ),
    kind !== "artist" && p.coverUrl !== false
      ? h(Img, {
          className: "ap-hero__cover",
          src: p.coverUrl,
          fallback: h(GenArt, {
            className: "ap-hero__cover",
            seed: p.coverSeed || p.album || p.title,
          }),
        })
      : null,
  );
}

function FactList(p) {
  return h(
    "dl",
    { className: "ap-root ap-facts" },
    (p.facts || []).reduce(function (a, f, i) {
      a.push(h("dt", { key: "t" + i }, f.label));
      a.push(h("dd", { key: "d" + i }, f.value));
      return a;
    }, []),
  );
}

function Tag(p) {
  return h(
    "button",
    {
      type: "button",
      className: "ap-tag",
      "aria-pressed": p.selected != null ? String(!!p.selected) : undefined,
      onClick: p.onClick,
    },
    p.children,
  );
}
function TagList(p) {
  return h(
    "div",
    { className: "ap-root ap-tags" },
    (p.tags || []).map(function (t) {
      return h(
        Tag,
        {
          key: t,
          selected: p.selected && p.selected.indexOf(t) > -1,
          onClick: function () {
            if (p.onToggle) p.onToggle(t);
          },
        },
        t,
      );
    }),
    p.onAdd
      ? h(
          "button",
          { type: "button", className: "ap-tag", "aria-label": "Ajouter", onClick: p.onAdd },
          icons.plus(),
        )
      : null,
  );
}

function AlbumGrid(p) {
  return h(
    "div",
    { className: "ap-root ap-albums", style: { "--cols": p.columns || 4 } },
    (p.items || []).map(function (a, i) {
      return h(
        A,
        { key: i, href: a.href || "#" },
        h(Img, {
          className: "ap-album__img",
          src: a.coverUrl,
          fallback: h(GenArt, { className: "ap-album__img", seed: a.title }),
        }),
        h("div", { className: "ap-album__title" }, a.title),
        a.artist
          ? h("div", { className: "ap-album__meta", style: { color: "var(--ink)" } }, a.artist)
          : null,
        a.meta ? h("div", { className: "ap-album__meta" }, a.meta) : null,
      );
    }),
  );
}

function MediaRow(p) {
  return h(
    "div",
    { className: "ap-root ap-media" },
    p.rank != null ? h("span", { className: "ap-media__rank" }, p.rank) : null,
    h(Cover, { src: p.coverUrl, seed: p.seed || p.title }),
    h(
      "div",
      { className: "ap-media__body" },
      h("div", { className: "ap-media__title" }, p.title),
      p.sub ? h("div", { className: "ap-media__sub" }, p.sub) : null,
      p.meta ? h("div", { className: "ap-media__meta" }, p.meta) : null,
    ),
    p.trailing ? h("div", { className: "ap-media__trail" }, p.trailing) : null,
  );
}

/* points: [{label, value}] — line (default) or bars */
function TrendChart(p) {
  var pts = p.points || [];
  var W = 480,
    H = p.height || 160,
    padB = 24,
    n = Math.max(pts.length, 1);
  var max = Math.max.apply(
    null,
    pts
      .map(function (x) {
        return x.value;
      })
      .concat([1]),
  );
  var ch = H - padB;
  var y = function (v) {
    return ch - (v / max) * (ch - 8);
  };
  var kids = [];
  var every = p.tickEvery || Math.ceil(n / 6);
  if (p.variant === "bars") {
    var bw = W / n;
    pts.forEach(function (pt, i) {
      var bh = Math.max(pt.value ? 2 : 0, ch - y(pt.value));
      kids.push(
        h(
          "rect",
          {
            key: "b" + i,
            className: cx("bar", i === n - 1 && p.highlightLast !== false && "is-cur"),
            x: i * bw + 1,
            y: ch - bh,
            width: Math.max(1, bw - 2),
            height: bh,
          },
          h("title", null, pt.label + " : " + pt.value),
        ),
      );
      if (i % every === 0)
        kids.push(
          h(
            "text",
            { key: "t" + i, className: "tick", x: i * bw + bw / 2, y: H - 6, textAnchor: "middle" },
            pt.tick || pt.label,
          ),
        );
    });
  } else {
    var step = n > 1 ? W / (n - 1) : W;
    var line = pts
      .map(function (pt, i) {
        return (i ? "L" : "M") + (i * step).toFixed(1) + " " + y(pt.value).toFixed(1);
      })
      .join(" ");
    for (var b = 0; b < n; b += every * 2)
      kids.push(
        h("rect", {
          key: "band" + b,
          className: "band",
          x: b * step,
          y: 0,
          width: Math.min(every * step, W - b * step),
          height: ch,
        }),
      );
    if (pts.length)
      kids.push(
        h("path", {
          key: "a",
          className: "area",
          d: line + " L" + W + " " + ch + " L0 " + ch + " Z",
        }),
      );
    kids.push(h("path", { key: "l", className: "line", d: line }));
    pts.forEach(function (pt, i) {
      if (i % every === 0)
        kids.push(
          h(
            "text",
            {
              key: "t" + i,
              className: "tick",
              x: i * step,
              y: H - 6,
              textAnchor: i === 0 ? "start" : "middle",
            },
            pt.tick || pt.label,
          ),
        );
    });
  }
  kids.push(
    h("line", { key: "base", className: "base", x1: 0, x2: W, y1: ch + 0.5, y2: ch + 0.5 }),
  );
  return h(
    "div",
    { className: "ap-root ap-trendchart" },
    p.caption ? h("div", { className: "ap-trendchart__cap" }, p.caption) : null,
    h(
      "svg",
      {
        viewBox: "0 0 " + W + " " + H,
        role: "img",
        "aria-label": p.caption || "Écoutes dans le temps",
      },
      kids,
    ),
  );
}

var LINK_ICONS = { web: "globe", search: "search", external: "external", play: "play" };
function LinkList(p) {
  return h(
    "ul",
    { className: "ap-root ap-links" },
    (p.links || []).map(function (l, i) {
      return h(
        "li",
        { key: i },
        h(
          A,
          { href: l.href || "#", target: "_blank", rel: "noopener" },
          icons[LINK_ICONS[l.icon] || l.icon || "external"](),
          l.label,
        ),
      );
    }),
  );
}

/* =================== Insights =================== */
function InsightCard(p) {
  return h(
    "div",
    { className: "ap-root ap-insight" },
    h("div", { className: "ap-label" }, p.label),
    p.value != null
      ? h(
          "div",
          { className: "ap-insight__value" },
          typeof p.value === "number" ? fmtNum(p.value) : p.value,
          p.unit ? h("small", null, p.unit) : null,
        )
      : null,
    p.caption ? h("div", { className: "ap-insight__cap" }, p.caption) : null,
    p.children ? h("div", { className: "ap-insight__body" }, p.children) : null,
  );
}

/* days: [{date, listenCount}] most recent last */
function StreakCard(p) {
  var c = p.current || {},
    l = p.longest || {};
  var days = (p.days || []).slice(-28);
  return h(
    InsightCard,
    {
      label: "Série en cours",
      value: c.days || 0,
      unit: (c.days || 0) > 1 ? "jours" : "jour",
      caption:
        "Record : " +
        plural(l.days || 0, "jour", "jours") +
        (l.from ? " (du " + fmtIso(l.from) + " au " + fmtIso(l.to) + ")" : ""),
    },
    days.length
      ? h(
          "div",
          null,
          h(
            "div",
            { className: "ap-streak", role: "img", "aria-label": "Jours avec au moins une écoute" },
            days.map(function (d, i) {
              return h("span", {
                key: i,
                className: cx(d.listenCount > 0 && "on", i === days.length - 1 && "today"),
                title: fmtIso(d.date) + " : " + plural(d.listenCount, "écoute", "écoutes"),
              });
            }),
          ),
          h(
            "div",
            { className: "ap-streak__legend" },
            h("span", null, fmtIso(days[0].date)),
            h("span", null, "aujourd'hui"),
          ),
        )
      : null,
  );
}
function fmtIso(s) {
  if (!s) return "";
  var a = s.split("-");
  return parseInt(a[2], 10) + " " + MONTHS_S[parseInt(a[1], 10) - 1];
}

function MilestoneList(p) {
  var items = p.items || [];
  var next = p.next,
    count = p.listenCount || 0;
  var prev = items.length ? items[items.length - 1].n : 0;
  return h(
    "ol",
    { className: "ap-root ap-miles" },
    items.map(function (m) {
      return h(
        "li",
        { key: m.n, className: "ap-mile" },
        h("span", { className: "ap-mile__n" }, fmtNum(m.n)),
        h(
          "div",
          null,
          h("div", { className: "ap-mile__title" }, m.track),
          h("div", { className: "ap-mile__sub" }, m.artist),
        ),
        h("span", { className: "ap-mile__date" }, fmtDate(m.listenedAt)),
      );
    }),
    next
      ? h(
          "li",
          { key: "next", className: "ap-mile ap-mile--next" },
          h("span", { className: "ap-mile__n" }, fmtNum(next)),
          h(
            "div",
            null,
            h(
              "div",
              { className: "ap-mile__title" },
              "Encore " + plural(next - count, "écoute", "écoutes"),
            ),
            h(
              "div",
              { className: "ap-progress" },
              h("span", {
                style: { width: Math.min(100, ((count - prev) / (next - prev)) * 100) + "%" },
              }),
            ),
          ),
          h("span", { className: "ap-mile__date" }, "à venir"),
        )
      : null,
  );
}

/* years: [{year, listens:[{artist, track, listenCount}]}] */
function OnThisDay(p) {
  var years = p.years || [];
  if (!years.length)
    return h(EmptyState, {
      icon: "calendar",
      title: "Rien ce jour-là, pour l'instant",
      text:
        "Revenez l'an prochain : Apollon vous montrera ce que vous écoutiez le " +
        (p.dateLabel || "même jour") +
        ".",
    });
  return h(
    "div",
    { className: "ap-root" },
    years.map(function (y) {
      return h(
        "div",
        { key: y.year },
        h("div", { className: "ap-otd__year" }, y.year),
        y.listens.map(function (l, i) {
          return h(MediaRow, {
            key: i,
            title: l.track,
            sub: l.artist,
            trailing: l.listenCount ? plural(l.listenCount, "écoute", "écoutes") : null,
          });
        }),
      );
    }),
  );
}

/* Wrapped: data from GET stats/wrapped */
function WrappedHero(p) {
  var w = p.data || {};
  var hours = Math.round((w.listeningTimeMs || 0) / 3600000);
  var cells = [
    { k: "Écoutes", v: fmtNum(w.listenCount) },
    { k: "Artistes", v: fmtNum(w.artistCount) },
    { k: "Jours actifs", v: fmtNum(w.activeDays) },
    { k: "Plus longue série", v: fmtNum(w.longestStreakDays), u: " jours" },
    { k: "Heure préférée", v: w.favouriteHour ? w.favouriteHour.hour + "h" : "—" },
    {
      k: "Jour record",
      v: w.busiestDay ? fmtNum(w.busiestDay.listenCount) : "—",
      u: w.busiestDay ? " le " + fmtIso(w.busiestDay.date) : "",
    },
  ];
  var top = (w.topArtists || [])[0];
  return h(
    "section",
    { className: "ap-root ap-wrapped" },
    h(
      "svg",
      { className: "ap-wrapped__shapes", viewBox: "0 0 360 56", "aria-hidden": "true" },
      [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) {
        return h("rect", { key: i, x: 360 - (i + 1) * 40, y: 0, width: 28, height: 56 - i * 6 });
      }),
    ),
    h(
      "div",
      { className: "ap-wrapped__inner" },
      h(
        "div",
        null,
        h(
          "div",
          { className: "ap-wrapped__eyebrow" },
          (p.userName ? p.userName + " · " : "") + "Votre année en musique",
        ),
        h("div", { className: "ap-wrapped__year" }, w.year),
        top
          ? h(
              "div",
              { className: "ap-wrapped__lead" },
              "Votre artiste de l'année : " +
                top.artist +
                ", " +
                plural(top.listenCount, "écoute", "écoutes") +
                ". " +
                (hours ? hours + " heures d'écoute mesurées." : ""),
            )
          : null,
      ),
      h(
        "div",
        { className: "ap-wrapped__grid" },
        cells.map(function (c, i) {
          return h(
            "div",
            { key: i, className: "ap-wrapped__cell" },
            h("div", { className: "ap-wrapped__k" }, c.k),
            h("div", { className: "ap-wrapped__v" }, c.v, c.u ? h("small", null, c.u) : null),
          );
        }),
      ),
    ),
  );
}
function RankedList(p) {
  return h(
    "ol",
    { className: "ap-root ap-ranked" },
    (p.items || []).map(function (it, i) {
      return h(
        "li",
        { key: i },
        h("span", { className: "ap-ranked__n" }, i + 1),
        h(
          "div",
          { style: { minWidth: 0 } },
          h("div", { className: "ap-ranked__t" }, it.title),
          it.sub ? h("div", { className: "ap-ranked__s" }, it.sub) : null,
        ),
        h("span", { className: "ap-ranked__c" }, plural(it.listenCount, "écoute", "écoutes")),
      );
    }),
  );
}

/* =================== Forms & feedback =================== */
var fieldId = 0;
function TextField(p) {
  var id = React.useMemo(function () {
    return p.id || "ap-f" + ++fieldId;
  }, []);
  return h(
    "div",
    { className: "ap-root ap-field" },
    p.label ? h("label", { className: "ap-field__label", htmlFor: id }, p.label) : null,
    h(
      "div",
      {
        className: cx(
          "ap-input",
          p.icon && "ap-input--icon",
          p.error && "ap-input--invalid",
          p.size === "lg" && "ap-input--lg",
        ),
      },
      p.icon && icons[p.icon] ? icons[p.icon]() : null,
      h("input", {
        id: id,
        type: p.type || "text",
        name: p.name,
        placeholder: p.placeholder,
        defaultValue: p.defaultValue,
        value: p.value,
        onChange: p.onChange,
        autoComplete: p.autoComplete,
        "aria-invalid": p.error ? "true" : undefined,
      }),
    ),
    p.error
      ? h("div", { className: "ap-field__err" }, icons.info(), p.error)
      : p.hint
        ? h("div", { className: "ap-field__hint" }, p.hint)
        : null,
  );
}
function SearchField(p) {
  return h(
    TextField,
    Object.assign(
      { icon: "search", type: "search", placeholder: "Rechercher un artiste, un album, un titre…" },
      p,
    ),
  );
}
function Select(p) {
  var id = React.useMemo(function () {
    return "ap-s" + ++fieldId;
  }, []);
  return h(
    "div",
    { className: "ap-root ap-field" },
    p.label ? h("label", { className: "ap-field__label", htmlFor: id }, p.label) : null,
    h(
      "div",
      { className: "ap-input ap-input--select" },
      h(
        "select",
        { id: id, defaultValue: p.defaultValue, value: p.value, onChange: p.onChange },
        (p.options || []).map(function (o) {
          return h("option", { key: o.value, value: o.value }, o.label);
        }),
      ),
      icons.chevron(),
    ),
    p.hint ? h("div", { className: "ap-field__hint" }, p.hint) : null,
  );
}
function Toggle(p) {
  return h(
    "label",
    { className: "ap-root ap-toggle" },
    h("input", {
      type: "checkbox",
      defaultChecked: p.defaultChecked,
      checked: p.checked,
      onChange: p.onChange,
    }),
    h("span", { className: "ap-toggle__track", "aria-hidden": "true" }),
    h(
      "span",
      null,
      h("div", { className: "ap-toggle__label" }, p.label),
      p.description ? h("div", { className: "ap-toggle__desc" }, p.description) : null,
    ),
  );
}
function Pagination(p) {
  var page = p.page || 1,
    count = p.pageCount || 1,
    set = [];
  for (var i = 1; i <= count; i++)
    if (i === 1 || i === count || Math.abs(i - page) <= 1) set.push(i);
  var out = [],
    prev = 0;
  set.forEach(function (n) {
    if (n - prev > 1) out.push(h("span", { key: "g" + n, className: "ap-pager__gap" }, "…"));
    out.push(
      h(
        "button",
        {
          key: n,
          type: "button",
          "aria-current": n === page ? "page" : undefined,
          onClick: function () {
            if (p.onChange) p.onChange(n);
          },
        },
        n,
      ),
    );
    prev = n;
  });
  return h(
    "nav",
    { className: "ap-root ap-pager", "aria-label": "Pagination" },
    h(
      "button",
      {
        type: "button",
        disabled: page <= 1,
        "aria-label": "Page précédente",
        onClick: function () {
          if (p.onChange) p.onChange(page - 1);
        },
      },
      icons.left(),
    ),
    out,
    h(
      "button",
      {
        type: "button",
        disabled: page >= count,
        "aria-label": "Page suivante",
        onClick: function () {
          if (p.onChange) p.onChange(page + 1);
        },
      },
      icons.more(),
    ),
  );
}
var TOAST_ICON = { success: "check", error: "info", info: "heart" };
function Toast(p) {
  var kind = p.kind || "success";
  return h(
    "div",
    {
      className: "ap-root ap-toast ap-toast--" + kind,
      role: kind === "error" ? "alert" : "status",
    },
    icons[p.icon || TOAST_ICON[kind]](kind === "info"),
    h("span", { className: "ap-toast__msg" }, p.message),
    p.actionLabel
      ? h(
          "button",
          { type: "button", className: "ap-toast__act", onClick: p.onAction },
          p.actionLabel,
        )
      : null,
    p.onClose
      ? h(
          "button",
          { type: "button", className: "ap-toast__x", "aria-label": "Fermer", onClick: p.onClose },
          icons.close(),
        )
      : null,
  );
}
function EmptyState(p) {
  return h(
    "div",
    { className: "ap-root ap-empty" },
    h("div", { className: "ap-empty__art" }, icons[p.icon || "note"]()),
    h("div", { className: "ap-empty__title" }, p.title),
    p.text ? h("div", { className: "ap-empty__text" }, p.text) : null,
    p.actionLabel
      ? h(Button, { variant: p.actionVariant || "primary", onClick: p.onAction }, p.actionLabel)
      : null,
  );
}
function Skeleton(p) {
  var n = p.count || 3,
    v = p.variant || "row";
  var bar = function (w, ht) {
    return h("div", { className: "ap-skel", style: { width: w, height: ht || 14 } });
  };
  if (v === "text")
    return h(
      "div",
      { className: "ap-root", style: { display: "grid", gap: "10px" }, "aria-busy": "true" },
      Array.apply(null, Array(n)).map(function (_, i) {
        return h("div", { key: i }, bar(i === n - 1 ? "60%" : "100%"));
      }),
    );
  if (v === "tile")
    return h(
      "div",
      { className: "ap-root ap-albums", style: { "--cols": n }, "aria-busy": "true" },
      Array.apply(null, Array(n)).map(function (_, i) {
        return h(
          "div",
          { key: i },
          h("div", { className: "ap-skel", style: { aspectRatio: "1" } }),
          h("div", { style: { marginTop: "12px" } }, bar("70%")),
          h("div", { style: { marginTop: "8px" } }, bar("40%")),
        );
      }),
    );
  return h(
    "div",
    { className: "ap-root", "aria-busy": "true", "aria-label": "Chargement" },
    Array.apply(null, Array(n)).map(function (_, i) {
      return h(
        "div",
        { key: i, className: "ap-skelrow" },
        bar(44, 44),
        bar(44, 44),
        bar("70%"),
        bar("50%"),
        bar("100%"),
      );
    }),
  );
}
function Menu(p) {
  return h(
    "ul",
    { className: "ap-root ap-menu", role: "menu" },
    (p.items || []).map(function (it, i) {
      if (it === "-") return h("li", { key: i, role: "separator" }, h("hr"));
      return h(
        "li",
        { key: i, role: "none" },
        h(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: it.danger ? "is-danger" : "",
            onClick: it.onClick,
          },
          it.icon && icons[it.icon] ? icons[it.icon]() : null,
          it.label,
        ),
      );
    }),
  );
}

/* =================== Reports (always dark) =================== */
function Delta(p) {
  if (p.value == null) return null;
  var up = p.value >= 0;
  return h(
    "span",
    {
      className: cx(
        "ap-dlt",
        p.tone !== false && (up ? "ap-dlt--up" : "ap-dlt--down"),
        p.className,
      ),
    },
    up ? icons.up() : icons.down(),
    Math.abs(Math.round(p.value)) + (p.unit == null ? " %" : p.unit),
  );
}
function ReportPage(p) {
  return h("div", { className: "ap-root ap-rp", "data-theme": "dark" }, p.children);
}
var RP_PERIODS = [
  { value: "week", label: "La semaine" },
  { value: "month", label: "Le mois" },
  { value: "year", label: "L'année" },
];
function ReportNav(p) {
  var periods = p.periods || RP_PERIODS;
  var st = React.useState(p.defaultPeriod || periods[0].value);
  var v = p.period != null ? p.period : st[0];
  return h(
    "div",
    { className: "ap-root ap-rpnav", "data-theme": "dark" },
    h(
      "nav",
      { className: "ap-rpnav__tabs" },
      periods.map(function (x) {
        return h(
          "button",
          {
            key: x.value,
            type: "button",
            className: "ap-rpnav__tab",
            "aria-current": x.value === v ? "true" : undefined,
            onClick: function () {
              st[1](x.value);
              if (p.onPeriod) p.onPeriod(x.value);
            },
          },
          x.label,
        );
      }),
    ),
    h(
      "div",
      { className: "ap-rpnav__range" },
      h(
        "div",
        { className: "ap-rp__wrap" },
        h(
          "button",
          {
            type: "button",
            className: "ap-rpnav__arrow",
            "aria-label": "Période précédente",
            onClick: p.onPrev,
          },
          icons.left(),
        ),
        h("span", { className: "ap-rpnav__label" }, p.rangeLabel),
        h(
          "button",
          {
            type: "button",
            className: "ap-rpnav__arrow",
            "aria-label": "Période suivante",
            disabled: !p.onNext,
            onClick: p.onNext,
          },
          icons.more(),
        ),
      ),
    ),
    h("div", { className: "ap-rpnav__stripe", "aria-hidden": "true" }),
  );
}
/* days: [{label, current, previous}] */
function ReportHero(p) {
  var days = p.days || [],
    n = days.length || 1;
  var max = Math.max.apply(
    null,
    days
      .map(function (d) {
        return Math.max(d.current || 0, d.previous || 0);
      })
      .concat([1]),
  );
  var W = 560,
    H = 190,
    ch = 160,
    gw = W / n,
    bw = Math.min(36, gw / 2 - 4);
  var bars = [];
  days.forEach(function (d, i) {
    var x0 = i * gw + gw / 2 - bw;
    var hc = Math.max(d.current ? 2 : 1, (d.current / max) * ch),
      hp = Math.max(d.previous ? 2 : 1, (d.previous / max) * ch);
    bars.push(
      h(
        "rect",
        { key: "c" + i, className: "cur", x: x0, y: ch - hc, width: bw, height: hc },
        h("title", null, d.label + " : " + d.current),
      ),
    );
    bars.push(
      h(
        "rect",
        { key: "p" + i, className: "prev", x: x0 + bw, y: ch - hp, width: bw, height: hp },
        h("title", null, d.label + " (avant) : " + d.previous),
      ),
    );
    bars.push(
      h(
        "text",
        { key: "l" + i, className: "lbl", x: i * gw + gw / 2, y: H - 6, textAnchor: "middle" },
        d.label,
      ),
    );
  });
  return h(
    "section",
    { className: "ap-root ap-rphero" },
    h(
      "div",
      { className: "ap-rp__wrap" },
      h(
        "div",
        null,
        p.deltaPercent != null
          ? h(
              "div",
              { className: "ap-rphero__delta" },
              p.deltaPercent >= 0 ? icons.up() : icons.down(),
              Math.abs(Math.round(p.deltaPercent)) +
                " % " +
                (p.deltaLabel || "par rapport à la semaine passée"),
            )
          : null,
        p.deltaPercent == null && p.deltaLabel
          ? h("div", { className: "ap-rphero__delta" }, p.deltaLabel)
          : null,
        h(
          "div",
          { className: "ap-rphero__count" },
          fmtNum(p.count) + " " + (p.unit || "scrobbles"),
        ),
      ),
      h(
        "div",
        null,
        h(
          "div",
          { className: "ap-rphero__legend" },
          h(
            "span",
            null,
            h("i", { style: { background: "var(--band-ink)" } }),
            p.currentLabel || "Cette semaine",
          ),
          h(
            "span",
            null,
            h("i", { style: { background: "var(--band-prev)" } }),
            p.previousLabel || "Semaine précédente",
          ),
        ),
        h(
          "svg",
          {
            viewBox: "0 0 " + W + " " + H,
            role: "img",
            "aria-label": "Écoutes par jour, comparées à la période précédente",
          },
          bars,
        ),
      ),
    ),
  );
}
var CAT = { artists: "Artistes", albums: "Albums", tracks: "Titres" };
function CategoryTile(p) {
  var k = p.kind || "artists";
  var spark = p.spark || [];
  var max = Math.max.apply(null, spark.concat([1]));
  return h(
    "div",
    { className: "ap-root ap-cat ap-chamfer ap-cat--" + k },
    h("div", { className: "ap-cat__label" }, p.label || CAT[k]),
    h(
      "div",
      { className: "ap-cat__row" },
      h("span", { className: "ap-cat__value" }, fmtNum(p.value)),
      h(Delta, { value: p.deltaPercent, tone: false, className: "ap-cat__delta" }),
      spark.length
        ? h(
            "span",
            { className: "ap-cat__spark", "aria-hidden": "true" },
            spark.map(function (v, i) {
              return h("span", { key: i, style: { height: Math.max(3, (v / max) * 48) + "px" } });
            }),
          )
        : null,
    ),
  );
}
var TOP_CHIP = { artists: "Top artiste", albums: "Top album", tracks: "Top titre" };
function TopFeature(p) {
  var k = p.kind || "artists",
    items = p.items || [],
    first = items[0] || {};
  return h(
    "div",
    { className: "ap-root ap-feat", "data-theme": "dark" },
    h(
      "div",
      {
        className: "ap-feat__img",
        style: first.imageUrl ? { backgroundImage: 'url("' + first.imageUrl + '")' } : undefined,
      },
      first.imageUrl
        ? null
        : h(GenArt, { className: "ap-feat__gen", seed: (first.sub || "") + first.title }),
      h("div", { className: "ap-feat__scrim" }),
      h(
        "div",
        { className: "ap-feat__cap" },
        h("span", { className: "ap-chip ap-chip--" + k }, p.chip || TOP_CHIP[k]),
        h("div", { className: "ap-feat__title" }, "#1 " + (first.title || "")),
        first.sub ? h("div", { className: "ap-feat__sub" }, first.sub) : null,
        h(
          "div",
          { className: "ap-feat__count" },
          plural(first.listenCount || 0, "scrobble", "scrobbles"),
        ),
      ),
    ),
    h(
      "ol",
      { className: "ap-feat__list" },
      items.slice(1, 5).map(function (it, i) {
        return h(
          "li",
          { key: i },
          h("span", null, "#" + (i + 2)),
          h("span", null, it.title),
          h("span", null, it.listenCount),
        );
      }),
    ),
  );
}
function ReportStat(p) {
  return h(
    "div",
    { className: "ap-root ap-rstat ap-chamfer", "data-theme": "dark" },
    h("div", { className: "ap-rstat__label" }, p.label),
    h(
      "div",
      { className: "ap-rstat__row" },
      h(
        "span",
        { className: "ap-rstat__value" },
        typeof p.value === "number" ? fmtNum(p.value) : p.value,
      ),
      p.unit ? h("span", { className: "ap-rstat__unit" }, p.unit) : null,
      h(Delta, { value: p.deltaPercent }),
    ),
    p.caption ? h("div", { className: "ap-rstat__caption" }, p.caption) : null,
  );
}
function ReportMini(p) {
  return h(
    "div",
    { className: "ap-root ap-rmini", "data-theme": "dark" },
    h(Cover, { src: p.coverUrl, seed: p.seed || p.title }),
    h(
      "div",
      { style: { minWidth: 0 } },
      h("div", { className: "ap-rmini__t" }, p.title),
      h("div", { className: "ap-rmini__s" }, p.sub),
    ),
  );
}
function ReportSection(p) {
  return h(
    "section",
    { className: "ap-root ap-rsec", "data-theme": "dark" },
    p.title ? h("h2", { className: "ap-rsec__title" }, p.title) : null,
    p.children,
  );
}
function ReportPanel(p) {
  return h(
    "div",
    { className: "ap-root", "data-theme": "dark" },
    h("h3", { className: "ap-rsub__title" }, p.title),
    p.children,
  );
}
/* rows: [{kind, current, previous}] */
function CompareBars(p) {
  var rows = p.rows || [];
  var max = Math.max.apply(
    null,
    rows
      .map(function (r) {
        return Math.max(r.current, r.previous);
      })
      .concat([1]),
  );
  return h(
    "div",
    { className: "ap-root ap-cmp", "data-theme": "dark" },
    rows.map(function (r, i) {
      return h(
        "div",
        { key: i, className: "ap-cmp__row" },
        h(
          "div",
          null,
          h("div", { className: "ap-cmp__k" }, r.label || CAT[r.kind]),
          h("div", { className: "ap-cmp__v" }, fmtNum(r.current)),
        ),
        h(
          "div",
          null,
          h(
            "div",
            { className: "ap-cmp__bars" },
            h(
              "div",
              { className: "ap-cmp__bar" },
              h("span", {
                style: {
                  width: (r.current / max) * 100 + "%",
                  background: "var(--cat-" + r.kind + ")",
                },
              }),
            ),
            h(
              "div",
              { className: "ap-cmp__bar ap-cmp__bar--prev" },
              h("span", { style: { width: (r.previous / max) * 100 + "%" } }),
            ),
          ),
          h(
            "div",
            { className: "ap-cmp__cap", style: { marginTop: "6px" } },
            "contre " + fmtNum(r.previous) + " " + (p.previousLabel || "la semaine précédente"),
          ),
        ),
      );
    }),
  );
}
/* axes: [{label, value 0..1, previous?, display?}] — polygon grid, never circles */
function FingerprintRadar(p) {
  var axes = p.axes || [],
    n = axes.length || 5,
    R = 130,
    cx0 = 220,
    cy0 = 170;
  var pt = function (i, r) {
    var a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx0 + Math.cos(a) * r, cy0 + Math.sin(a) * r];
  };
  var poly = function (f) {
    return axes
      .map(function (ax, i) {
        return pt(i, R * Math.max(0.02, Math.min(1, f(ax)))).join(",");
      })
      .join(" ");
  };
  var kids = [];
  [0.25, 0.5, 0.75, 1].forEach(function (s, j) {
    kids.push(
      h("polygon", {
        key: "g" + j,
        className: "grid",
        points: axes
          .map(function (_, i) {
            return pt(i, R * s).join(",");
          })
          .join(" "),
      }),
    );
  });
  axes.forEach(function (ax, i) {
    var e = pt(i, R);
    kids.push(h("line", { key: "a" + i, className: "axis", x1: cx0, y1: cy0, x2: e[0], y2: e[1] }));
  });
  var hasPrev = axes.some(function (a) {
    return a.previous != null;
  });
  if (hasPrev)
    kids.push(
      h("polygon", {
        key: "sp",
        className: "shape--prev shape",
        points: poly(function (a) {
          return a.previous || 0;
        }),
      }),
    );
  kids.push(
    h("polygon", {
      key: "s",
      className: "shape",
      points: poly(function (a) {
        return a.value;
      }),
    }),
  );
  axes.forEach(function (ax, i) {
    var q = pt(i, R * Math.max(0.02, Math.min(1, ax.value)));
    kids.push(
      h("rect", { key: "p" + i, className: "pt", x: q[0] - 4, y: q[1] - 4, width: 8, height: 8 }),
    );
    var l = pt(i, R + 26),
      anchor = Math.abs(l[0] - cx0) < 10 ? "middle" : l[0] > cx0 ? "start" : "end";
    kids.push(
      h("text", { key: "l" + i, className: "lbl", x: l[0], y: l[1], textAnchor: anchor }, ax.label),
    );
    kids.push(
      h(
        "text",
        { key: "v" + i, className: "val", x: l[0], y: l[1] + 18, textAnchor: anchor },
        ax.display || Math.round(ax.value * 100) + " %",
      ),
    );
  });
  return h(
    "div",
    { className: "ap-root ap-radar", "data-theme": "dark" },
    h(
      "div",
      { className: "ap-legend2" },
      h(
        "span",
        null,
        h("i", { style: { background: "var(--cat-artists)" } }),
        p.currentLabel || "Cette semaine",
      ),
      hasPrev
        ? h(
            "span",
            null,
            h("i", { style: { background: "var(--cat-tracks)" } }),
            p.previousLabel || "Semaine précédente",
          )
        : null,
    ),
    h("svg", { viewBox: "0 0 440 360", role: "img", "aria-label": "Empreinte d'écoute" }, kids),
  );
}
/* hours: 24 counts */
function HourClock(p) {
  var hrs = p.hours || [],
    max = Math.max.apply(null, hrs.concat([1])),
    peak = hrs.indexOf(max);
  var W = 480,
    H = 200,
    ch = 170,
    bw = W / 24;
  var kids = [];
  hrs.forEach(function (v, i) {
    kids.push(
      h("rect", { key: "b" + i, className: "bg", x: i * bw + 1, y: 0, width: bw - 2, height: ch }),
    );
    if (v)
      kids.push(
        h(
          "rect",
          {
            key: "v" + i,
            className: i === peak ? "peak" : "on",
            x: i * bw + 1,
            y: ch - (v / max) * ch,
            width: bw - 2,
            height: (v / max) * ch,
          },
          h("title", null, i + "h : " + v),
        ),
      );
    if (i % 6 === 0)
      kids.push(
        h(
          "text",
          { key: "t" + i, className: "tk", x: i * bw + 2, y: H - 8 },
          String(i).padStart(2, "0") + "h",
        ),
      );
  });
  return h(
    "div",
    { className: "ap-root ap-hclock", "data-theme": "dark" },
    h(
      "svg",
      { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Écoutes par heure" },
      kids,
    ),
    h(
      "div",
      null,
      h("div", { className: "ap-hclock__k" }, "Heure la plus chargée"),
      h("div", { className: "ap-hclock__v" }, String(peak).padStart(2, "0") + ":00"),
      h("div", { className: "ap-hclock__k" }, "Scrobbles pendant cette heure"),
      h("div", { className: "ap-hclock__v" }, fmtNum(max)),
    ),
  );
}

/* =================== Profile sub-pages =================== */
function PageTitle(p) {
  return h(
    "div",
    { className: "ap-root ap-ptitle" },
    h("h1", null, p.title, p.count != null ? " (" + fmtNum(p.count) + ")" : ""),
    p.onPlayAll
      ? h(
          "button",
          { type: "button", className: "ap-ptitle__play", onClick: p.onPlayAll },
          h("span", { className: "ap-play" }, icons.play()),
          p.playLabel || "Tout écouter",
        )
      : null,
    p.actions ? h("div", { className: "ap-ptitle__end" }, p.actions) : null,
  );
}
/* obsession: Favourite from GET /users/{u}/obsession */
function ObsessionTile(p) {
  var o = p.obsession || {};
  return h(
    A,
    {
      className: cx("ap-root ap-obstile", p.current && "ap-obstile--current"),
      href: p.href || "#",
      style: p.coverUrl ? { backgroundImage: 'url("' + p.coverUrl + '")' } : undefined,
    },
    p.coverUrl ? null : h(GenArt, { className: "ap-obstile__gen", seed: o.album || o.track }),
    h("div", { className: "ap-obstile__scrim" }),
    h(
      "div",
      { className: "ap-obstile__text" },
      p.current || (o.since && o.until == null && p.current !== false)
        ? h("span", { className: "ap-obstile__badge" }, "En ce moment")
        : p.longest
          ? h(
              "span",
              { className: "ap-obstile__badge ap-obstile__badge--silver" },
              "La plus longue",
            )
          : null,
      h("div", { className: "ap-obstile__t" }, o.track),
      h("div", { className: "ap-obstile__a" }, o.artist),
      o.since ? h("div", { className: "ap-obstile__d" }, obsPeriod(o, p.now)) : null,
    ),
  );
}
function obsPeriod(o, now) {
  var end = o.until != null ? o.until : now || Math.floor(Date.now() / 1000);
  var days = Math.max(1, Math.round((end - o.since) / 86400));
  return (
    (o.until != null
      ? fmtDate(o.since) + " → " + fmtDate(o.until)
      : "depuis le " + fmtDate(o.since)) +
    " · " +
    plural(days, "jour", "jours")
  );
}
function fmtLongDate(ts) {
  var d = new Date(ts * 1000);
  return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}
var FOOT = [
  {
    title: "Instance",
    links: ["À propos de cette instance", "Conditions d'utilisation", "Version"],
  },
  {
    title: "Aide",
    links: [
      "Connecter un lecteur",
      "Importer depuis Last.fm",
      "Importer depuis ListenBrainz",
      "API (/v1/docs)",
    ],
  },
  { title: "Compte", links: ["Réglages", "Clés d'API", "Exporter mes écoutes", "Se déconnecter"] },
  { title: "Projet", links: ["Code source", "Signaler un problème", "Notes de version"] },
];
function SiteFooter(p) {
  var cols = p.columns || FOOT;
  return h(
    "footer",
    { className: "ap-root ap-foot" },
    h(
      "div",
      { className: "ap-foot__cols", style: { "--cols": cols.length } },
      cols.map(function (c, i) {
        return h(
          "div",
          { key: i },
          h("h4", { className: "ap-foot__h" }, c.title),
          h(
            "ul",
            null,
            c.links.map(function (l, j) {
              var o = typeof l === "string" ? { label: l, href: "#" } : l;
              return h("li", { key: j }, h(A, { href: o.href || "#" }, o.label));
            }),
          ),
        );
      }),
    ),
    h(
      "div",
      { className: "ap-foot__bar" },
      h(
        "div",
        null,
        p.lang !== false
          ? h(LangSelect, { value: p.lang || undefined, defaultValue: "fr", onChange: p.onLang })
          : null,
        h("span", null, "Fuseau horaire : ", h("strong", null, p.timeZone || "Europe/Paris")),
        p.version ? h("span", null, "Version " + p.version) : null,
        h("span", null, "Scrobbler auto-hébergé, compatible ListenBrainz"),
        null,
      ),
    ),
  );
}

/* =================== Logo =================== */
var LOGO_WORD =
  "M22.063999999999997 17.355999999999998V32.272Q22.063999999999997 32.492 21.909999999999997 32.646Q21.755999999999997 32.8 21.535999999999998 32.8H16.387999999999998Q16.168 32.8 16.014 32.646Q15.86 32.492 15.86 32.272V30.819999999999997Q15.86 30.687999999999995 15.771999999999998 30.644Q15.684 30.599999999999998 15.596 30.731999999999996Q13.748 33.151999999999994 9.656 33.151999999999994Q6.224 33.151999999999994 4.112 31.479999999999997Q2.0 29.807999999999996 2.0 26.552Q2.0 23.163999999999998 4.3759999999999994 21.293999999999997Q6.752 19.424 11.152 19.424H15.639999999999999Q15.86 19.424 15.86 19.203999999999997V18.235999999999997Q15.86 16.784 14.98 15.969999999999999Q14.1 15.155999999999999 12.34 15.155999999999999Q10.975999999999999 15.155999999999999 10.074 15.639999999999999Q9.172 16.124 8.908 17.003999999999998Q8.776 17.488 8.336 17.443999999999996L3.0120000000000005 16.74Q2.484 16.651999999999997 2.528 16.343999999999998Q2.7039999999999997 14.495999999999999 4.002 12.999999999999998Q5.3 11.503999999999998 7.433999999999999 10.667999999999997Q9.568 9.831999999999997 12.208 9.831999999999997Q15.068 9.831999999999997 17.311999999999998 10.821999999999997Q19.555999999999997 11.811999999999998 20.809999999999995 13.527999999999999Q22.063999999999997 15.244 22.063999999999997 17.355999999999998ZM15.86 24.924V23.339999999999996Q15.86 23.119999999999997 15.639999999999999 23.119999999999997H12.472Q10.491999999999999 23.119999999999997 9.37 23.868Q8.248 24.616 8.248 25.979999999999997Q8.248 27.168 9.084 27.849999999999998Q9.92 28.531999999999996 11.328 28.531999999999996Q13.219999999999999 28.531999999999996 14.54 27.519999999999996Q15.86 26.507999999999996 15.86 24.924Z M46.967999999999996 21.535999999999998Q46.967999999999996 24.571999999999996 46.13199999999999 27.035999999999998Q45.11999999999999 29.851999999999997 42.94199999999999 31.501999999999995Q40.763999999999996 33.151999999999994 37.55199999999999 33.151999999999994Q34.384 33.151999999999994 32.623999999999995 30.951999999999998Q32.535999999999994 30.819999999999997 32.44799999999999 30.863999999999997Q32.36 30.907999999999998 32.36 31.04V40.455999999999996Q32.36 40.675999999999995 32.205999999999996 40.83Q32.05199999999999 40.983999999999995 31.831999999999994 40.983999999999995H26.683999999999997Q26.463999999999995 40.983999999999995 26.309999999999995 40.83Q26.155999999999995 40.675999999999995 26.155999999999995 40.455999999999996V10.712Q26.155999999999995 10.491999999999997 26.309999999999995 10.337999999999997Q26.463999999999995 10.183999999999997 26.683999999999997 10.183999999999997H31.831999999999994Q32.05199999999999 10.183999999999997 32.205999999999996 10.337999999999997Q32.36 10.491999999999997 32.36 10.712V12.163999999999998Q32.36 12.296 32.44799999999999 12.318Q32.535999999999994 12.34 32.623999999999995 12.251999999999999Q34.471999999999994 9.831999999999997 37.727999999999994 9.831999999999997Q40.763999999999996 9.831999999999997 42.986 11.525999999999998Q45.208 13.219999999999999 46.175999999999995 16.255999999999997Q46.967999999999996 18.5 46.967999999999996 21.535999999999998ZM40.544 21.448Q40.544 18.676 39.62 17.048Q38.608 15.155999999999999 36.364 15.155999999999999Q34.339999999999996 15.155999999999999 33.327999999999996 17.048Q32.403999999999996 18.631999999999998 32.403999999999996 21.491999999999997Q32.403999999999996 24.439999999999998 33.372 26.067999999999998Q34.384 27.827999999999996 36.364 27.827999999999996Q38.343999999999994 27.827999999999996 39.443999999999996 26.112Q40.544 24.395999999999997 40.544 21.448Z M50.57599999999999 25.935999999999996Q49.959999999999994 23.868 49.959999999999994 21.448Q49.959999999999994 18.851999999999997 50.57599999999999 16.784Q51.587999999999994 13.527999999999999 54.227999999999994 11.679999999999998Q56.867999999999995 9.831999999999997 60.56399999999999 9.831999999999997Q64.172 9.831999999999997 66.72399999999999 11.657999999999998Q69.276 13.483999999999998 70.332 16.74Q71.03599999999999 18.939999999999998 71.03599999999999 21.36Q71.03599999999999 23.735999999999997 70.41999999999999 25.804Q69.452 29.235999999999997 66.834 31.193999999999996Q64.216 33.151999999999994 60.519999999999996 33.151999999999994Q56.82399999999999 33.151999999999994 54.18399999999999 31.215999999999994Q51.54399999999999 29.279999999999998 50.57599999999999 25.935999999999996ZM64.43599999999999 24.528Q64.788 23.119999999999997 64.788 21.448Q64.788 19.599999999999998 64.43599999999999 18.323999999999998Q63.95199999999999 16.827999999999996 62.93999999999999 15.991999999999997Q61.92799999999999 15.155999999999999 60.47599999999999 15.155999999999999Q58.97999999999999 15.155999999999999 57.989999999999995 15.991999999999997Q56.99999999999999 16.827999999999996 56.55999999999999 18.323999999999998Q56.20799999999999 19.379999999999995 56.20799999999999 21.448Q56.20799999999999 23.427999999999997 56.51599999999999 24.528Q56.95599999999999 26.067999999999998 57.989999999999995 26.947999999999997Q59.023999999999994 27.827999999999996 60.519999999999996 27.827999999999996Q61.971999999999994 27.827999999999996 62.983999999999995 26.947999999999997Q63.995999999999995 26.067999999999998 64.43599999999999 24.528Z M74.59999999999998 32.272V2.5279999999999987Q74.59999999999998 2.308 74.75399999999999 2.154Q74.90799999999999 2.0 75.12799999999999 2.0H80.27599999999998Q80.49599999999998 2.0 80.64999999999998 2.154Q80.80399999999999 2.308 80.80399999999999 2.5279999999999987V32.272Q80.80399999999999 32.492 80.64999999999998 32.646Q80.49599999999998 32.8 80.27599999999998 32.8H75.12799999999999Q74.90799999999999 32.8 74.75399999999999 32.646Q74.59999999999998 32.492 74.59999999999998 32.272Z M84.89599999999997 32.272V2.5279999999999987Q84.89599999999997 2.308 85.04999999999998 2.154Q85.20399999999998 2.0 85.42399999999998 2.0H90.57199999999997Q90.79199999999997 2.0 90.94599999999997 2.154Q91.09999999999998 2.308 91.09999999999998 2.5279999999999987V32.272Q91.09999999999998 32.492 90.94599999999997 32.646Q90.79199999999997 32.8 90.57199999999997 32.8H85.42399999999998Q85.20399999999998 32.8 85.04999999999998 32.646Q84.89599999999997 32.492 84.89599999999997 32.272Z M95.23599999999996 25.935999999999996Q94.61999999999996 23.868 94.61999999999996 21.448Q94.61999999999996 18.851999999999997 95.23599999999996 16.784Q96.24799999999996 13.527999999999999 98.88799999999996 11.679999999999998Q101.52799999999996 9.831999999999997 105.22399999999996 9.831999999999997Q108.83199999999997 9.831999999999997 111.38399999999996 11.657999999999998Q113.93599999999996 13.483999999999998 114.99199999999996 16.74Q115.69599999999997 18.939999999999998 115.69599999999997 21.36Q115.69599999999997 23.735999999999997 115.07999999999997 25.804Q114.11199999999997 29.235999999999997 111.49399999999997 31.193999999999996Q108.87599999999996 33.151999999999994 105.17999999999996 33.151999999999994Q101.48399999999997 33.151999999999994 98.84399999999997 31.215999999999994Q96.20399999999997 29.279999999999998 95.23599999999996 25.935999999999996ZM109.09599999999998 24.528Q109.44799999999996 23.119999999999997 109.44799999999996 21.448Q109.44799999999996 19.599999999999998 109.09599999999998 18.323999999999998Q108.61199999999997 16.827999999999996 107.59999999999997 15.991999999999997Q106.58799999999997 15.155999999999999 105.13599999999997 15.155999999999999Q103.63999999999997 15.155999999999999 102.64999999999998 15.991999999999997Q101.65999999999997 16.827999999999996 101.21999999999997 18.323999999999998Q100.86799999999997 19.379999999999995 100.86799999999997 21.448Q100.86799999999997 23.427999999999997 101.17599999999997 24.528Q101.61599999999997 26.067999999999998 102.64999999999998 26.947999999999997Q103.68399999999997 27.827999999999996 105.17999999999996 27.827999999999996Q106.63199999999996 27.827999999999996 107.64399999999996 26.947999999999997Q108.65599999999996 26.067999999999998 109.09599999999998 24.528Z M138.88399999999996 17.839999999999996V32.272Q138.88399999999996 32.492 138.72999999999996 32.646Q138.57599999999996 32.8 138.35599999999997 32.8H133.20799999999997Q132.98799999999997 32.8 132.83399999999995 32.646Q132.67999999999995 32.492 132.67999999999995 32.272V19.116Q132.67999999999995 17.355999999999998 131.68999999999994 16.256Q130.69999999999996 15.155999999999999 129.07199999999997 15.155999999999999Q127.44399999999996 15.155999999999999 126.45399999999997 16.256Q125.46399999999997 17.355999999999998 125.46399999999997 19.116V32.272Q125.46399999999997 32.492 125.30999999999997 32.646Q125.15599999999996 32.8 124.93599999999996 32.8H119.78799999999997Q119.56799999999997 32.8 119.41399999999996 32.646Q119.25999999999996 32.492 119.25999999999996 32.272V10.712Q119.25999999999996 10.491999999999997 119.41399999999996 10.337999999999997Q119.56799999999997 10.183999999999997 119.78799999999997 10.183999999999997H124.93599999999996Q125.15599999999996 10.183999999999997 125.30999999999997 10.337999999999997Q125.46399999999997 10.491999999999997 125.46399999999997 10.712V12.251999999999999Q125.46399999999997 12.383999999999997 125.55199999999996 12.427999999999997Q125.63999999999996 12.471999999999998 125.68399999999997 12.383999999999997Q127.48799999999997 9.831999999999997 131.05199999999996 9.831999999999997Q134.57199999999997 9.831999999999997 136.72799999999995 11.987999999999998Q138.88399999999996 14.143999999999998 138.88399999999996 17.839999999999996Z";
/* The logo is the wordmark alone: "apollon", Barlow 700, outlined.
     tone: "default" (ink), "on-dark" (white), "gold" (on the black top bar) */
function Logo(p) {
  var size = p.size || 28;
  return h(
    "svg",
    {
      className: "ap-logo ap-logo--" + (p.tone || "default"),
      viewBox: "0 0 140.9 43.0",
      height: size,
      width: Math.round((size * 140.9) / 43.0),
      role: "img",
      "aria-label": "Apollon",
    },
    h("path", { className: "ap-logo__word", d: LOGO_WORD }),
  );
}

/* =================== Visitors & auth =================== */
function NoticeBar(p) {
  return h(
    "div",
    { className: "ap-root ap-notice" },
    h(
      "div",
      { className: "ap-notice__in" },
      icons[p.icon || "info"](),
      h("span", { className: "ap-notice__msg" }, p.message),
      p.actionLabel
        ? h(A, { className: "ap-link", href: p.actionHref || "#" }, p.actionLabel, icons.more())
        : null,
    ),
  );
}
function AuthLayout(p) {
  return h(
    "div",
    { className: "ap-root ap-auth" },
    h(
      "div",
      { className: "ap-auth__brand" },
      h("div", { className: "ap-auth__quote" }, p.quote || "Votre historique d'écoute, chez vous."),
      h(
        "svg",
        { viewBox: "0 0 400 112", className: "ap-auth__bars", "aria-hidden": "true" },
        [400, 300, 248, 196, 144].map(function (w, i) {
          return h("rect", {
            key: i,
            x: 0,
            y: i * 24,
            width: w * 0.9,
            height: 16,
            className: i === 0 ? "is-gold" : "",
          });
        }),
      ),
    ),
    h(
      "div",
      { className: "ap-auth__form" },
      h("h1", { className: "ap-auth__title" }, p.title),
      p.lead ? h("p", { className: "ap-auth__lead" }, p.lead) : null,
      p.children,
    ),
  );
}
var FEATURES = [
  {
    icon: "history",
    title: "Scrobblez depuis vos lecteurs",
    text: "Navidrome, Jellyfin, Pano Scrobbler, mpd… tout ce qui parle ListenBrainz envoie vos écoutes ici.",
  },
  {
    icon: "calendar",
    title: "Rapports et rétrospective",
    text: "Semaine, mois, année : tops, horloge d'écoute, séries, découvertes et votre année en musique.",
  },
  {
    icon: "external",
    title: "Vos données chez vous",
    text: "Importez votre historique Last.fm ou ListenBrainz, exportez-le quand vous voulez. Aucune publicité.",
  },
];
function FeatureList(p) {
  return h(
    "div",
    { className: "ap-root ap-feats" },
    (p.items || FEATURES).map(function (f, i) {
      return h(
        "div",
        { key: i, className: "ap-featx" },
        h("div", { className: "ap-empty__art" }, icons[f.icon || "note"]()),
        h("div", { className: "ap-featx__t" }, f.title),
        h("div", { className: "ap-featx__x" }, f.text),
      );
    }),
  );
}
function LandingHero(p) {
  return h(
    "section",
    { className: "ap-root ap-land", "data-theme": "dark" },
    h(
      "div",
      { className: "ap-land__in" },
      h("h1", { className: "ap-land__title" }, p.title || "Votre historique d'écoute, chez vous."),
      p.lead ? h("p", { className: "ap-land__lead" }, p.lead) : null,
      h("div", { className: "ap-land__cta" }, p.actions),
    ),
    h(
      "svg",
      { className: "ap-land__bars", viewBox: "0 0 480 280", "aria-hidden": "true" },
      [412, 300, 248, 248, 196, 196, 144, 120].map(function (w, i) {
        return h("rect", {
          key: i,
          x: 480 - w,
          y: i * 34,
          width: w,
          height: 26,
          className: i === 0 ? "is-gold" : "",
        });
      }),
    ),
  );
}

/* =================== Toast region & API keys =================== */
/* Holds every toast, fixed at the bottom centre of the viewport, newest at the bottom. */
function ToastRegion(p) {
  return h("div", { className: "ap-root ap-toasts", "aria-live": "polite" }, p.children);
}

/* keys: [{id, name, start, createdAt, lastUsedAt}] — an account can hold several API keys */
function ApiKeyList(p) {
  var keys = p.keys || [];
  return h(
    "div",
    { className: "ap-root" },
    h(
      "div",
      { className: "ap-keys__head" },
      h(
        "div",
        { className: "ap-keys__hint" },
        p.hint ||
          "Une clé par lecteur ou par appareil : vous pouvez en révoquer une sans toucher aux autres.",
      ),
      h(
        Button,
        { variant: "secondary", size: "sm", icon: "plus", onClick: p.onCreate },
        "Nouvelle clé",
      ),
    ),
    p.revealed
      ? h(
          "div",
          { className: "ap-keyreveal", role: "status" },
          h("div", { className: "ap-keyreveal__t" }, "Clé « " + p.revealed.name + " » créée"),
          h(
            "div",
            { className: "ap-keyreveal__row" },
            h("div", { className: "ap-keyreveal__key" }, p.revealed.key),
            h(Button, { variant: "primary", onClick: p.onCopy }, "Copier"),
          ),
          h(
            "div",
            { className: "ap-keyreveal__x" },
            "Copiez-la maintenant : elle ne sera plus affichée en entier.",
          ),
        )
      : null,
    keys.length
      ? h(
          "div",
          { className: "ap-keys" },
          keys.map(function (k) {
            return h(
              "div",
              { key: k.id, className: "ap-key" },
              h(
                "div",
                { className: "ap-key__name" },
                k.name,
                h("span", { className: "ap-key__prefix" }, (k.start || "apl_") + "…"),
              ),
              h(
                "div",
                { className: "ap-key__meta" },
                "Créée le " +
                  fmtDate(k.createdAt) +
                  " · " +
                  (k.lastUsedAt
                    ? "dernière utilisation " + fmtAgo(k.lastUsedAt, p.now)
                    : "jamais utilisée"),
              ),
              h(
                "div",
                { className: "ap-key__act" },
                h(
                  Button,
                  {
                    variant: "danger",
                    size: "sm",
                    onClick: function () {
                      if (p.onRevoke) p.onRevoke(k);
                    },
                  },
                  "Révoquer",
                ),
              ),
            );
          }),
        )
      : h(EmptyState, {
          icon: "plus",
          title: "Aucune clé d'API",
          text: "Créez une clé et collez-la dans votre lecteur pour envoyer vos écoutes.",
          actionLabel: "Créer une clé",
          onAction: p.onCreate,
        }),
  );
}

/* =================== Lauriers =================== */
/* An angular laurel: two straight stems in a V, diamond leaves pointing outwards. No circles. */
function LaurelMark(p) {
  var leaves = [];
  for (var i = 0; i < 5; i++) {
    var t = i / 4,
      yl = 78 - t * 56,
      xl = 30 - t * 14,
      xr = 70 + t * 14;
    leaves.push(
      h("polygon", {
        key: "l" + i,
        className: "ap-laurel__leaf",
        points:
          xl -
          9 +
          "," +
          (yl - 6) +
          " " +
          xl +
          "," +
          (yl - 12) +
          " " +
          (xl + 2) +
          "," +
          yl +
          " " +
          (xl - 7) +
          "," +
          (yl + 6),
      }),
    );
    leaves.push(
      h("polygon", {
        key: "r" + i,
        className: "ap-laurel__leaf",
        points:
          xr +
          9 +
          "," +
          (yl - 6) +
          " " +
          xr +
          "," +
          (yl - 12) +
          " " +
          (xr - 2) +
          "," +
          yl +
          " " +
          (xr + 7) +
          "," +
          (yl + 6),
      }),
    );
  }
  return h(
    "svg",
    { className: "ap-laurel__svg", viewBox: "0 0 100 100", "aria-hidden": "true" },
    h("polyline", { className: "ap-laurel__stem", points: "34,84 46,94 54,94 66,84" }),
    h("line", { className: "ap-laurel__stem", x1: 33, y1: 84, x2: 15, y2: 20 }),
    h("line", { className: "ap-laurel__stem", x1: 67, y1: 84, x2: 85, y2: 20 }),
    leaves,
    h(
      "text",
      {
        className: "ap-laurel__value",
        x: 50,
        y: 58,
        textAnchor: "middle",
        style: String(p.value).length > 3 ? { fontSize: "15px" } : undefined,
      },
      p.value,
    ),
  );
}
/* laurel: {title, description, value, tier: "laurel" | "gold", earnedAt?, progress?: {current, target}} */
function LaurelBadge(p) {
  var l = p.laurel || {},
    earned = !l.progress || l.progress.current >= l.progress.target;
  var pct = l.progress ? Math.min(100, (l.progress.current / l.progress.target) * 100) : 100;
  return h(
    "div",
    {
      className: cx(
        "ap-root ap-laurel",
        earned ? "ap-laurel--" + (l.tier || "laurel") : "ap-laurel--locked",
        p.compact && "ap-laurel--compact",
      ),
      title: p.compact ? l.title + (l.description ? " · " + l.description : "") : undefined,
    },
    h("div", { className: "ap-laurel__art" }, h(LaurelMark, { value: l.value })),
    p.compact
      ? null
      : h(
          "div",
          { className: "ap-laurel__body" },
          h("div", { className: "ap-laurel__t" }, l.title),
          h("div", { className: "ap-laurel__d" }, l.description),
          earned
            ? h(
                "div",
                { className: "ap-laurel__when" },
                l.earnedAt ? "Obtenu le " + fmtDate(l.earnedAt) : "Obtenu",
              )
            : h(
                "div",
                null,
                h("div", { className: "ap-progress" }, h("span", { style: { width: pct + "%" } })),
                h(
                  "div",
                  { className: "ap-laurel__when" },
                  fmtNum(l.progress.current) + " / " + fmtNum(l.progress.target),
                ),
              ),
        ),
  );
}
function LaurelGrid(p) {
  return h(
    "div",
    { className: "ap-root ap-laurels" },
    (p.items || []).map(function (l, i) {
      return h(LaurelBadge, { key: i, laurel: l });
    }),
  );
}
function LaurelStrip(p) {
  var items = (p.items || [])
    .filter(function (l) {
      return !l.progress || l.progress.current >= l.progress.target;
    })
    .slice(0, p.max || 5);
  return h(
    "div",
    { className: "ap-root ap-laurelstrip" },
    h(
      "div",
      { className: "ap-laurelstrip__row" },
      items.map(function (l, i) {
        return h(LaurelBadge, { key: i, laurel: l, compact: true });
      }),
    ),
    p.total != null
      ? h(
          A,
          { className: "ap-link", href: p.href || "#" },
          fmtNum(p.total) + " lauriers obtenus",
          icons.more(),
        )
      : null,
  );
}

/* =================== Appearance =================== */
var THEMES = [
  { value: "light", label: "Jour" },
  { value: "dark", label: "Nuit" },
  { value: "marble", label: "Marbre" },
  { value: "system", label: "Comme l'appareil" },
];
function ThemeSwatch(p) {
  var th = p.theme === "system" ? "light" : p.theme;
  return h(
    "div",
    { className: "ap-swatch", "data-theme": th, style: p.style },
    h("div", { className: "ap-swatch__bar" }),
    h(
      "div",
      { className: "ap-swatch__body" },
      h("div", { className: "ap-swatch__t" }),
      h("div", { className: "ap-swatch__l" }),
      h("div", { className: "ap-swatch__l ap-swatch__l--s" }),
      h("div", { className: "ap-swatch__btn" }),
    ),
  );
}
function AppearancePicker(p) {
  var st = React.useState(p.defaultTheme || "light"),
    sa = React.useState(p.defaultAccent || "#f2b62b");
  var theme = p.theme || st[0],
    accent = p.accent || sa[0];
  return h(
    "div",
    { className: "ap-root ap-appear" },
    h("div", { className: "ap-field__label" }, "Thème"),
    h(
      "div",
      { className: "ap-appear__row", role: "radiogroup", "aria-label": "Thème" },
      THEMES.map(function (t) {
        return h(
          "button",
          {
            key: t.value,
            type: "button",
            role: "radio",
            "aria-checked": String(t.value === theme),
            className: "ap-choice",
            onClick: function () {
              st[1](t.value);
              if (p.onTheme) p.onTheme(t.value);
            },
          },
          h(ThemeSwatch, {
            theme: t.value,
            accent: accent,
            style: accentVars(accent, t.value === "system" ? "light" : t.value),
          }),
          h("span", { className: "ap-choice__l" }, t.label),
        );
      }),
    ),
    h("div", { className: "ap-field__label", style: { marginTop: "24px" } }, "Couleur du profil"),
    h(
      "div",
      { className: "ap-field__hint", style: { marginTop: "-4px", marginBottom: "8px" } },
      "Les visiteurs voient votre profil dans cette couleur. Trois couleurs d'Apollon, ou la vôtre.",
    ),
    h(AccentPicker, {
      value: p.accent,
      defaultValue: p.defaultAccent,
      theme: theme === "system" ? "light" : theme,
      onChange: function (x) {
        sa[1](x);
        if (p.onAccent) p.onAccent(x);
      },
    }),
  );
}

/* =================== Search =================== */
function Highlight(p) {
  var t = String(p.text || ""),
    q = (p.query || "").trim();
  if (!q) return t;
  var i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return t;
  return [
    t.slice(0, i),
    h("mark", { key: "m", className: "ap-hl" }, t.slice(i, i + q.length)),
    t.slice(i + q.length),
  ];
}
/* data: GET /users/{u}/search → {query, artists[], albums[], tracks[]} */
function SearchResults(p) {
  var d = p.data || {},
    q = d.query || p.query || "",
    only = p.only;
  var row = function (key, title, sub, count, seed, cover) {
    return h(
      A,
      { key: key, href: "#", className: "ap-sres__row" },
      h(Cover, { src: cover, seed: seed }),
      h(
        "div",
        { className: "ap-media__body" },
        h("div", { className: "ap-media__title" }, h(Highlight, { text: title, query: q })),
        sub
          ? h("div", { className: "ap-media__sub" }, h(Highlight, { text: sub, query: q }))
          : null,
      ),
      h("span", { className: "ap-media__trail" }, plural(count, "écoute", "écoutes")),
    );
  };
  var block = function (k, title, items, render) {
    if (only && only !== k) return null;
    if (!only && !items.length) return null;
    return h(
      "section",
      { key: k, className: "ap-sres__block" },
      h("h3", { className: "ap-sres__h" }, title, h("span", null, items.length)),
      items.length
        ? items.map(render)
        : h("div", { className: "ap-sres__none" }, "Aucun résultat."),
    );
  };
  var cov =
    p.coverFor ||
    function () {
      return undefined;
    };
  var total = (d.artists || []).length + (d.albums || []).length + (d.tracks || []).length;
  if (!total)
    return h(EmptyState, {
      icon: "search",
      title: "Rien pour « " + q + " »",
      text: "La recherche porte sur les noms d'artistes, d'albums et de titres de votre bibliothèque. Vérifiez l'orthographe ou essayez un seul mot.",
    });
  return h(
    "div",
    { className: "ap-root ap-sres" },
    block("artists", "Artistes", d.artists || [], function (a, i) {
      return row("a" + i, a.artist, null, a.listenCount, a.artist, cov(a));
    }),
    block("albums", "Albums", d.albums || [], function (a, i) {
      return row("b" + i, a.album, a.artist, a.listenCount, a.album, cov(a));
    }),
    block("tracks", "Titres", d.tracks || [], function (t, i) {
      return row(
        "t" + i,
        t.track,
        t.artist + (t.album ? " · " + t.album : ""),
        t.listenCount,
        t.album || t.artist,
        cov(t),
      );
    }),
  );
}

/* =================== Custom accent from any #rrggbb (PATCH /me accent) =================== */
function hexToRgb(hx) {
  hx = String(hx || "").replace("#", "");
  if (hx.length === 3)
    hx = hx
      .split("")
      .map(function (c) {
        return c + c;
      })
      .join("");
  var n = parseInt(hx, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(c) {
  return (
    "#" +
    c
      .map(function (v) {
        return ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2);
      })
      .join("")
  );
}
function lum(c) {
  var f = function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
}
function contrast(a, b) {
  var x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function mix(a, b, t) {
  return [0, 1, 2].map(function (i) {
    return a[i] + (b[i] - a[i]) * t;
  });
}
/* shift a colour toward black (light grounds) or white (dark grounds) until it reaches the ratio */
function untilContrast(c, ground, ratio) {
  var to = lum(ground) > 0.4 ? [0, 0, 0] : [255, 255, 255];
  for (var t = 0; t <= 1.0001; t += 0.02) {
    var m = mix(c, to, t);
    if (contrast(m, ground) >= ratio) return m;
  }
  return to;
}
/* Returns the CSS variables that replace the gold-* accent for this hex, per theme. */
function accentVars(hex, theme) {
  if (!hex) return {};
  var c = hexToRgb(hex),
    ground = hexToRgb(theme === "dark" ? "#141518" : theme === "marble" ? "#f3efe6" : "#ffffff");
  var ink = contrast(c, [17, 17, 17]) >= contrast(c, [255, 255, 255]) ? "#111111" : "#ffffff";
  var hover = mix(c, lum(c) > 0.3 ? [0, 0, 0] : [255, 255, 255], 0.12);
  return {
    "--gold-500": rgbToHex(c),
    "--gold-600": rgbToHex(hover),
    "--gold-ink": ink,
    "--gold-text": rgbToHex(untilContrast(c, ground, 4.6)),
    "--gold-mark": rgbToHex(untilContrast(c, ground, 3.1)),
    "--gold-tint": rgbToHex(mix(ground, c, theme === "dark" ? 0.18 : 0.2)),
  };
}
var ACCENT_PRESETS = [
  { value: "#f2b62b", label: "Or", note: "Phœbus, la lumière" },
  { value: "#c0c5cb", label: "Argent", note: "l'arc, la nuit" },
  { value: "#7cb987", label: "Laurier", note: "la couronne" },
];
function AccentPicker(p) {
  var st = React.useState(p.defaultValue || "#f2b62b");
  var v = (p.value || st[0]).toLowerCase(),
    set = function (x) {
      st[1](x);
      if (p.onChange) p.onChange(x);
    };
  var isPreset = ACCENT_PRESETS.some(function (a) {
    return a.value === v;
  });
  return h(
    "div",
    { className: "ap-root" },
    h(
      "div",
      { className: "ap-appear__row", role: "radiogroup", "aria-label": "Couleur du profil" },
      ACCENT_PRESETS.map(function (a) {
        return h(
          "button",
          {
            key: a.value,
            type: "button",
            role: "radio",
            "aria-checked": String(a.value === v),
            className: "ap-choice ap-choice--accent",
            onClick: function () {
              set(a.value);
            },
          },
          h("span", { className: "ap-choice__chip", style: { background: a.value } }),
          h(
            "span",
            null,
            h("span", { className: "ap-choice__l" }, a.label),
            h("span", { className: "ap-choice__n" }, a.note),
          ),
        );
      }),
      h(
        "label",
        {
          className: "ap-choice ap-choice--accent",
          "aria-checked": String(!isPreset),
          role: "radio",
        },
        h(
          "span",
          {
            className: "ap-choice__chip ap-choice__chip--custom",
            style: { background: isPreset ? undefined : v },
          },
          h("input", {
            type: "color",
            value: v,
            "aria-label": "Couleur personnalisée",
            onChange: function (e) {
              set(e.target.value);
            },
          }),
        ),
        h(
          "span",
          null,
          h("span", { className: "ap-choice__l" }, "Personnalisée"),
          h("span", { className: "ap-choice__n" }, isPreset ? "choisir une couleur" : v),
        ),
      ),
    ),
    p.preview !== false
      ? h(
          "div",
          { className: "ap-accentprev", style: accentVars(v, p.theme || "light") },
          h(Button, { variant: "primary", size: "sm" }, "C'est mon obsession"),
          h("span", { className: "ap-link" }, "Plus de titres", icons.more()),
          h("span", { className: "ap-accentprev__tab" }, "Aperçu"),
          h(LoveButton, { loved: true }),
        )
      : null,
  );
}

/* =================== Mobile =================== */
var TABBAR = [
  { value: "profile", label: "Profil", icon: "user" },
  { value: "reports", label: "Rapports", icon: "chart" },
  { value: "search", label: "Chercher", icon: "search" },
  { value: "laurels", label: "Lauriers", icon: "laurel" },
  { value: "loved", label: "Cœurs", icon: "heart" },
];
/* Bottom tab bar, phones only (hidden above 720px). Put .ap-has-tabbar on the page so content clears it. */
function MobileTabBar(p) {
  var items = p.items || TABBAR,
    active = p.active || items[0].value;
  return h(
    "nav",
    { className: "ap-root ap-tabbar", "aria-label": "Navigation" },
    items.map(function (t) {
      return h(
        A,
        {
          key: t.value,
          href: t.href || "#",
          className: "ap-tabbar__item",
          "aria-current": t.value === active ? "page" : undefined,
        },
        icons[t.icon] ? icons[t.icon](t.icon === "heart" && t.value === active) : null,
        h("span", null, t.label),
      );
    }),
  );
}
/* Compact now-playing strip that sits above the tab bar on phones. */
function MiniNowPlaying(p) {
  var t = p.track;
  if (!t) return null;
  return h(
    "div",
    { className: "ap-root ap-mininp", role: "status" },
    h(Cover, { src: p.coverUrl, seed: t.album || t.artist }),
    h(
      "div",
      { className: "ap-mininp__body" },
      h("div", { className: "ap-mininp__t" }, t.track),
      h("div", { className: "ap-mininp__a" }, t.artist),
    ),
    h("span", { className: "ap-eq", "aria-label": "En cours d'écoute" }, h("i"), h("i"), h("i")),
    p.loved !== undefined ? h(LoveButton, { loved: p.loved, onToggle: p.onToggleLove }) : null,
  );
}
/* Full-screen menu opened by the burger of SiteHeader on phones. visitor: no account section. */
function MobileMenu(p) {
  var links = p.links || [
    "Aperçu",
    "Rapports",
    "Bibliothèque",
    "Coups de cœur",
    "Obsessions",
    "Lauriers",
  ];
  return h(
    "div",
    { className: "ap-root ap-mmenu", "data-theme": "dark", role: "dialog", "aria-label": "Menu" },
    h(
      "div",
      { className: "ap-mmenu__top" },
      h("span", { className: "ap-mmenu__label" }, "Menu"),
      h(
        "button",
        { type: "button", className: "ap-mmenu__x", "aria-label": "Fermer", onClick: p.onClose },
        icons.close(),
      ),
    ),
    p.userName
      ? h(
          "div",
          { className: "ap-mmenu__who" },
          h(Avatar, { name: p.userName, src: p.avatarUrl }),
          h(
            "div",
            null,
            h("div", { className: "ap-mmenu__name" }, p.userName),
            p.subtitle ? h("div", { className: "ap-mmenu__sub" }, p.subtitle) : null,
          ),
        )
      : null,
    h(
      "ul",
      { className: "ap-mmenu__list" },
      links.map(function (l, i) {
        var o = typeof l === "string" ? { label: l } : l;
        return h(
          "li",
          { key: i },
          h(
            A,
            {
              href: o.href || "#",
              "aria-current": o.label === p.active ? "page" : undefined,
              onClick: p.onClose,
            },
            o.label,
            icons.more(),
          ),
        );
      }),
    ),
    h(
      "div",
      { className: "ap-mmenu__lang" },
      h("span", null, "Langue"),
      h(LangSelect, { value: p.lang, defaultValue: "fr", onChange: p.onLang }),
    ),
    p.visitor
      ? h(
          "div",
          { className: "ap-mmenu__acts" },
          p.signupOpen !== false
            ? h(
                A,
                { className: "ap-btn ap-btn--primary", href: p.signupHref || "#" },
                "Créer un compte",
              )
            : null,
          h(A, { className: "ap-btn ap-btn--light", href: p.loginHref || "#" }, "Se connecter"),
        )
      : h(
          "ul",
          { className: "ap-mmenu__list ap-mmenu__list--sm" },
          (
            p.accountLinks || [
              { label: "Réglages" },
              { label: "Clés d'API" },
              { label: "Se déconnecter" },
            ]
          ).map(function (l) {
            return h(
              "li",
              { key: l.label },
              l.onClick
                ? h(
                    "button",
                    { type: "button", className: "ap-mmenu__btn", onClick: l.onClick },
                    l.label,
                  )
                : h(A, { href: l.href || "#", onClick: p.onClose }, l.label),
            );
          }),
        ),
  );
}

/* =================== Language =================== */
var LANGS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];
/* Language select: a compact native select with a globe. tone "dark" (footer, mobile menu) or "light" (settings). */
function LangSelect(p) {
  var st = React.useState(p.defaultValue || "fr"),
    v = p.value || st[0];
  return h(
    "label",
    { className: cx("ap-root ap-langsel", p.tone === "light" && "ap-langsel--light") },
    icons.globe(),
    h(
      "select",
      {
        value: v,
        "aria-label": "Langue",
        onChange: function (e) {
          st[1](e.target.value);
          if (p.onChange) p.onChange(e.target.value);
        },
      },
      LANGS.map(function (l) {
        return h("option", { key: l.value, value: l.value, lang: l.value }, l.label);
      }),
    ),
    icons.chevron(),
  );
}

export {
  SiteHeader,
  ProfileHeader,
  StatInline,
  Button,
  PlayButton,
  LoveButton,
  LibraryTabs,
  SectionHeader,
  MoreLink,
  TrackRow,
  TrackList,
  TopChart,
  ArtworkGrid,
  ActionCard,
  ObsessionCard,
  ReportCard,
  ClockHeatmap,
  TrendBadge,
  Page,
  Columns,
  IconButton,
  Avatar,
  Cover,
  EntityHero,
  FactList,
  Tag,
  TagList,
  AlbumGrid,
  MediaRow,
  TrendChart,
  LinkList,
  InsightCard,
  StreakCard,
  MilestoneList,
  OnThisDay,
  WrappedHero,
  RankedList,
  TextField,
  SearchField,
  Select,
  Toggle,
  Pagination,
  Toast,
  EmptyState,
  Skeleton,
  Menu,
  ReportPage,
  ReportNav,
  ReportHero,
  CategoryTile,
  TopFeature,
  ReportStat,
  ReportMini,
  ReportSection,
  ReportPanel,
  CompareBars,
  FingerprintRadar,
  HourClock,
  Delta,
  PageTitle,
  ObsessionTile,
  SiteFooter,
  Logo,
  LangSelect,
  MobileTabBar,
  MiniNowPlaying,
  MobileMenu,
  SearchResults,
  AccentPicker,
  accentVars,
  GenArt,
  ListeningBanner,
  LaurelBadge,
  LaurelGrid,
  LaurelStrip,
  AppearancePicker,
  ToastRegion,
  ApiKeyList,
  NoticeBar,
  AuthLayout,
  FeatureList,
  LandingHero,
};
export const format = { number: fmtNum, ago: fmtAgo, day: fmtDay, date: fmtDate, plural: plural };
export { icons };
