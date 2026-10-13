// Special pages of the candidate app: welcome, choice of joining, review & submit
import { useState } from "react";
import { useForm } from "../lib/form.jsx";
import { useI18n, LangSwitch } from "../lib/i18n.jsx";
import { useNav } from "./nav.js";
import { S, vis, nextVis } from "../lib/flow.js";
import { prog } from "../lib/progress.js";
import { IDB } from "../lib/files.js";
import { LOGO } from "../content/definitions.js";
import { Field, Agree } from "../components/form/Items.jsx";
import { SigBox } from "../components/form/parts.jsx";
import { Pill, Html } from "../components/Pill.jsx";
import { ThankYou } from "./ThankYou.jsx";
import { useDevTaps } from "../components/DevEntry.jsx";

export function Welcome() {
  const { LANG } = useI18n();
  const go = useNav();
  const [pick, setPick] = useState(false);
  const taps = useDevTaps();
  const hi = LANG === "hi";
  const vEn =
    "We see all BPL women in rural area of eastern Uttar Pradesh, Madhya Pradesh/Bundelkhand, Chhattisgarh, Jharkhand and Bihar having access to microfinance services.";
  const vHi =
    "हम पूर्वी उत्तर प्रदेश, मध्य प्रदेश/बुंदेलखंड, छत्तीसगढ़, झारखंड और बिहार के ग्रामीण क्षेत्रों की सभी बीपीएल महिलाओं को माइक्रोफाइनेंस सेवाओं तक पहुँच प्राप्त करते हुए देखते हैं।";
  const mHi =
    "गरीबी रेखा से नीचे की महिलाओं को संयुक्त देयता समूहों (JLGs) के रूप में संगठित कर उन्हें माइक्रोफाइनेन्स और अन्य महत्वपूर्ण क्रेडिट प्लस सेवाओं तक पहुँच प्रदान करना — जो ग्राहक केन्द्रित हों, उनकी भलाई बढ़ाने के लिए डिज़ाइन की गई हों, और नैतिक, प्रतिष्ठित, पारदर्शी, न्यायसंगत व लागत प्रभावी तरीके से वितरित हों।";
  const mEn =
    "To serve women below the poverty line, organised as Joint Liability Groups, with client-centred microfinance and credit-plus services designed to improve their well-being, delivered in an ethical, reputable, transparent, fair and cost-effective way.";
  const P = [
    [
      "hrsm",
      "1",
      "HRSM",
      hi
        ? "फॉर्म की समीक्षा, संशोधन व इंटरव्यू मूल्यांकन"
        : "Review & edit forms, interview assessment",
    ],
    [
      "rm",
      "2",
      "RM / DRM",
      hi
        ? "सारांश व DL / LL घोषणा — हस्ताक्षर सहित अनुमोदन"
        : "Summary & DL / LL declarations — approve with signature",
    ],
    [
      "ho",
      "3",
      hi ? "HO भर्ती टीम" : "HO Recruitment Team",
      hi
        ? "कर्मचारी आईडी, जॉइनिंग तिथि, RCS नंबर व अंतिम अनुमोदन"
        : "Employee ID, joining date, RCS No. & final approval",
    ],
  ];
  return (
    <>
      <div className="welcome-top">
        <LangSwitch />
      </div>
      <div className="hero">
        <img src={LOGO} alt="CASHPOR Micro Credit logo" onClick={taps} />
        <div className="reg">
          {hi ? "पंजीकरण सं." : "Regd. No."} U65910UP2002NPL027113
        </div>
        <h1>
          {hi ? (
            <>
              <span className="r">कैशपॉर</span>
              <sup style={{ fontSize: ".4em" }}>®</sup>{" "}
              <span className="g">माइक्रो क्रेडिट</span>
            </>
          ) : (
            <>
              <span className="r">CASHPOR</span>
              <sup style={{ fontSize: ".4em" }}>®</sup>{" "}
              <span className="g">MICRO CREDIT</span>
            </>
          )}
        </h1>
        <div className="tag">
          {hi
            ? "ग्रामीण गरीबों को वित्तीय सेवाएँ प्रदान करने वाली संस्था"
            : "Providers of financial services to the rural poor"}
        </div>
        <div className="tag" style={{ fontSize: 14 }}>
          {hi
            ? "कैशपॉर माइक्रो क्रेडिट — सेक्शन 25 (इंडियन कम्पनीज एक्ट 1956) के तहत पंजीकृत नॉट फॉर प्रॉफिट कंपनी · वाराणसी"
            : "Section 25 (Indian Companies Act 1956) not-for-profit company · Varanasi"}
        </div>
      </div>
      <div className="vm">
        <section className="card vision">
          <div className="k">{hi ? "हमारा विज़न" : "Our Vision"}</div>
          <blockquote>{hi ? vHi : vEn}</blockquote>
        </section>
        <section className="card mission">
          <div className="k">{hi ? "हमारा मिशन" : "Our Mission"}</div>
          <blockquote>{hi ? mHi : mEn}</blockquote>
        </section>
      </div>
      <div
        className="foot-row"
        style={{ justifyContent: "center", margin: "4px 0 22px" }}
      >
        <button className="btn pri" onClick={() => go(1)}>
          {hi ? "ऑनबोर्डिंग शुरू करें →" : "Start onboarding →"}
        </button>
        <button
          className="btn"
          type="button"
          data-revpick
          onClick={() => setPick(true)}
        >
          {hi ? "समीक्षा" : "Review"}
        </button>
      </div>
      {pick && (
        <div id="revPick">
          <h3 style={{ textAlign: "center", margin: "0 0 12px" }}>
            {hi
              ? "समीक्षा — अपना सेक्शन चुनें"
              : "Review — choose your section"}
          </h3>
          <div className="panels3">
            {P.map((x) => (
              <a
                key={x[0]}
                href={"/review#" + x[0]}
                className={`card panel3 p-${x[0].toUpperCase()} pick`}
                data-revpanel={x[0]}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="pn">{x[1]}</div>
                <h3>{x[2]}</h3>
                <p>{x[3]}</p>
                <span className="btn pri sm">{hi ? "खोलें →" : "Open →"}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function Choose() {
  const { st, set } = useForm();
  const { LANG, TI, TX } = useI18n();
  const go = useNav();
  const hi = LANG === "hi",
    t = st["@track"];
  const pickTrack = (v) =>
    set("@track", v, (prev) => {
      const x = {};
      if (v === "TCM" || v === "PCM-CT") {
        x["@role"] = v;
        if (!prev["@post"]) x["@post"] = v;
      }
      if (v === "Rejoin") {
        if (!prev["assess.prev"]) x["assess.prev"] = "Yes";
        if (!prev["info.prevInt"]) x["info.prevInt"] = "हाँ";
      }
      return x;
    });
  const tile = (val, title, sub) => (
    <label key={val}>
      <input
        type="radio"
        name="@track"
        value={val}
        checked={t === val}
        onChange={() => pickTrack(val)}
      />
      <div>
        <b>{title}</b>
        <span>{sub}</span>
      </div>
    </label>
  );
  const nx = nextVis(1, st);
  const TRK = {
    "New Join": TX("New Join", "नई जॉइनिंग"),
    Rejoin: TX("Rejoin", "पुनः जॉइनिंग"),
  };
  return (
    <section className="card">
      <h3>{hi ? "अपना विकल्प चुनें" : "Choose your section"}</h3>
      <div className="choice">
        {tile(
          "TCM",
          "TCM",
          hi
            ? "फील्ड एक्सपोज़र लेटर + TCM टेस्ट पेपर"
            : "Field Exposure Letter + TCM test paper",
        )}
        {tile(
          "PCM-CT",
          "PCM-CT",
          hi
            ? "प्रथम फील्ड ट्रेनिंग फॉर्म + PCM-CT टेस्ट पेपर"
            : "First Field Training Form + PCM-CT test paper",
        )}
        {tile(
          "New Join",
          hi ? "नई जॉइनिंग" : "New Join",
          hi
            ? "नई जॉइनिंग — जॉइनिंग फॉर्म, घोषणा पत्र, मूल्यांकन, बैक लेटर, शपथपत्र, वेतन खाता, लाइसेंस"
            : "Joining form, declarations, assessment, back letter, affidavits, salary account, licence",
        )}
        {tile(
          "Rejoin",
          hi ? "पुनः जॉइनिंग" : "Rejoin",
          hi
            ? "पुनः जॉइनिंग — पहले कैशपॉर में कार्य कर चुके हैं"
            : "You have worked at CASHPOR before",
        )}
      </div>
      {t === "Rejoin" && (
        <div>
          <div className="note">
            <b>{hi ? "पुनः जॉइनिंग :" : "Rejoining:"}</b>{" "}
            {hi
              ? "अपना पुराना स्टाफ आईडी व UAN नम्बर कर्मचारी सूचना शीट और EPF/EPS/ESI घोषणा में अवश्य भरें। "
              : "Enter your old staff ID and UAN number in the Employee Information Sheet and the EPF/EPS/ESI declaration."}
          </div>
          <div className="grid">
            <Field
              sec="choose"
              it={{
                id: "oldId",
                l: hi ? "पुराना स्टाफ आईडी" : "Old staff ID",
                type: "text",
              }}
            />
            <Field
              sec="choose"
              it={{ id: "@uan", l: "UAN नम्बर", type: "text" }}
            />
          </div>
        </div>
      )}
      <div>
        {t ? (
          <>
            <div className="score">
              <Pill cls="ok">{TRK[t] || t}</Pill>
            </div>
            {nx > 0 && nx < S.length - 1 && (
              <div
                className="foot-row"
                style={{ marginTop: 6, justifyContent: "flex-start" }}
              >
                <button className="btn pri" onClick={() => go(nx)}>
                  {hi ? "आगे बढ़ें — " : "Continue to "}
                  {TI(S[nx].id, st)} →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="score">
            <Pill cls="warn">
              {hi
                ? "आगे बढ़ने के लिए एक विकल्प चुनें"
                : "Choose one option to continue"}
            </Pill>
          </div>
        )}
      </div>
    </section>
  );
}

export function ReviewSubmit() {
  const { st, files, set, opts } = useForm();
  const { LANG, TI, TX } = useI18n();
  const [msg, setMsg] = useState(null);
  const hi = LANG === "hi";
  const f = [
    [hi ? "विकल्प" : "Section", "@track"],
    [hi ? "पद" : "Post", "@role"],
    [hi ? "नाम" : "Name", "@name"],
    [hi ? "पिता का नाम" : "Father", "@father"],
    [hi ? "अंचल" : "Region (अंचल)", "@region"],
    [hi ? "शाखा" : "Branch", "@branch"],
    [hi ? "मोबाइल" : "Mobile", "@mobile"],
    [hi ? "ईमेल" : "Email", "@email"],
    ["UAN", "@uan"],
    [hi ? "जन्म तिथि" : "Date of birth", "@dob"],
    [hi ? "नियुक्ति तिथि" : "Date of joining", "@doj"],
    [hi ? "हस्ताक्षर" : "Signature", "@sig"],
  ];
  const submit = async () => {
    const miss = S.slice(1, -1).filter((s, j) => {
      if (!vis(j + 1, st)) return false;
      const p = prog(j + 1, st);
      return p.fill + p.ag < p.tot + p.agTot;
    });
    if (!st["review.final"] || !st["@sig"])
      return setMsg(
        <div className="note">
          <b>{hi ? "अभी जमा नहीं हुआ।" : "Not submitted yet."}</b>{" "}
          {hi
            ? "अंतिम घोषणा पर टिक करें और अपने हस्ताक्षर अपलोड करें।"
            : "Tick the final declaration and upload your signature above."}
        </div>,
      );
    if (miss.length)
      return setMsg(
        <div className="note">
          <b>
            {miss.length}{" "}
            {hi
              ? "फॉर्म में अभी खाली फील्ड या अस्वीकृत नीतियाँ हैं:"
              : "forms still have empty fields or unaccepted policies:"}
          </b>{" "}
          {miss.map((s) => TI(s.id, st)).join(", ")}.
        </div>,
      );
    setMsg(
      <div className="note">
        {TX("Submitting your forms…", "आपके फॉर्म जमा हो रहे हैं…")}
      </div>,
    );
    try {
      const all = await IDB.all();
      const fl = { ...all, ...files };
      const r = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: st["review.ref"] || null,
          data: st,
          files: fl,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Error " + r.status);
      set("review.ref", j.ref, {
        "review.submittedAt": new Date().toISOString(),
      });
      setMsg(null);
    } catch (e) {
      setMsg(
        <div className="note">
          <b>{TX("Not submitted.", "जमा नहीं हुआ।")}</b> {e.message}{" "}
          {TX(
            "Check your internet connection and press Submit again.",
            "इंटरनेट कनेक्शन जाँचें और फिर से जमा करें दबाएँ।",
          )}
        </div>,
      );
    }
  };
  return (
    <>
      <section className="card">
        <h3>{hi ? "अभ्यर्थी" : "Candidate"}</h3>
        <dl className="facts" id="revFacts">
          {f.map(([l, key]) => (
            <div key={key}>
              <dt>{l}</dt>
              <dd>
                {key === "@sig"
                  ? st[key]
                    ? "✓ " + (hi ? "अपलोड हो गया" : "uploaded")
                    : "—"
                  : st[key] || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="card">
        <h3>{hi ? "अंतिम घोषणा" : "Final declaration"}</h3>
        <Agree
          k="review.final"
          text={TX(
            "I declare that all the information given in this onboarding is completely true and that I have read and accepted all the policies.",
            "मैं घोषणा करता/करती हूँ कि इस ऑनबोर्डिंग में दी गई सभी जानकारी पूर्णतः सत्य है और मैंने सभी नीतियाँ पढ़कर स्वीकार की हैं।",
          )}
        />
        <div className="grid">
          <div className="fld">
            <span className="lbl">{TX("Signature", "हस्ताक्षर")}</span>
            <SigBox k="@sig" mine />
          </div>
          <Field sec="review" it={{ id: "date", l: "दिनांक", type: "date" }} />
          <Field sec="review" it={{ id: "place", l: "स्थान", type: "text" }} />
        </div>
        {!opts.readOnly && (
          <div
            className="foot-row noprint"
            style={{ justifyContent: "flex-start" }}
          >
            <button className="btn pri" id="submitBtn" onClick={submit}>
              {hi ? "जमा करें" : "Submit"}
            </button>
            <button
              className="btn"
              id="printBtn"
              onClick={() => window.print()}
            >
              {hi ? "PDF सेव करें" : "Save PDF"}
            </button>
          </div>
        )}
        <div id="submitMsg">
          {msg}
          {!msg && st["review.submittedAt"] ? <ThankYou kind="join" /> : null}
        </div>
      </section>
    </>
  );
}
export { Html };
