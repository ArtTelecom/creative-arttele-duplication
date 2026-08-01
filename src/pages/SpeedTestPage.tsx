import Navbar from "@/components/Navbar";
import SpeedTestContent from "./speed-test/SpeedTestContent";
import { useSpeedTest } from "./speed-test/useSpeedTest";

export default function SpeedTestPage() {
  const { phase, results, currentValue, history, setHistory, runTest, diag } = useSpeedTest();

  return (
    <div className="min-h-screen mesh-bg noise font-sans text-white">
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <SpeedTestContent
          phase={phase}
          results={results}
          currentValue={currentValue}
          history={history}
          setHistory={setHistory}
          runTest={runTest}
          diag={diag}
        />
      </div>
    </div>
  );
}