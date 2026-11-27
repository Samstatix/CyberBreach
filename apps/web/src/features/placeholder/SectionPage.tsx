import { ArrowLeft, Construction } from "lucide-react";
import { Link } from "react-router-dom";

type Props = { title: string; eyebrow: string; description: string };

export default function SectionPage({ title, eyebrow, description }: Props) {
  return (
    <section className="section-page">
      <Link className="back-link" to="/"><ArrowLeft size={14} /> BACK TO OVERVIEW</Link>
      <div className="eyebrow">{eyebrow} / CYBERBREACH</div>
      <h1>{title}</h1>
      <p className="section-description">{description}</p>
      <div className="coming-panel"><Construction size={22} /><div><strong>Under development</strong><p>This section has a route and a place in the platform architecture. Its learning content and functionality will be built in the next development milestones.</p></div></div>
    </section>
  );
}
