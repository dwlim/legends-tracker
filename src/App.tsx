import { UpgradeLibrary } from "./UpgradeLibrary";
import "./styles.css";

function App() {
  return (
    <main className="page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="shell">
        <UpgradeLibrary />
      </section>
    </main>
  );
}

export default App;
