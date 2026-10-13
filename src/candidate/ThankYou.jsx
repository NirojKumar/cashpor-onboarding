import { useForm } from '../lib/form.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { LOGO } from '../content/definitions.js';

export function ThankYou({ kind }) {
  const { st } = useForm(); const { TX } = useI18n();
  const name = st['@name'] || '';
  const msg = kind === 'test'
    ? TX('Your test has been submitted. HR will check your written answers and case study and contact you about the next step.', 'आपका टेस्ट जमा हो गया है। HR आपकी लिखित उत्तर व केस स्टडी जाँचकर अगले चरण के बारे में आपसे संपर्क करेगा।')
    : TX('Your joining forms have been submitted. Please hand your original documents and stamp papers to HR. We look forward to working with you.', 'आपके जॉइनिंग फॉर्म जमा हो गए हैं। कृपया अपने मूल दस्तावेज़ व स्टाम्प पेपर HR को जमा करें। हम आपके साथ काम करने के लिए उत्सुक हैं।');
  return <section className="card thanks"><img src={LOGO} alt="" style={{ width: 64, height: 'auto' }} /><div>
    <h3 style={{ fontSize: 22, marginBottom: 4 }}>{TX('Thank you', 'धन्यवाद')}{name ? ', ' + name : ''}!</h3>
    <p style={{ margin: '0 0 6px', maxWidth: '62ch' }}>{msg}</p>
    <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>{TX('Welcome to the CASHPOR family.', 'कैशपॉर परिवार में आपका स्वागत है।')}{kind === 'join' && st['review.ref'] ? <> · {TX('Reference no.', 'संदर्भ संख्या')}: <b>{st['review.ref']}</b></> : null}</p></div></section>;
}
