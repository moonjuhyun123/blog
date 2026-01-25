import "../styles/hacker.css";
import "../styles/matrix.css";
import MatrixRain from "../components/MatrixRain";
import IntroPane from "../components/IntroPane";

export default function Home() {
  return (
    <div className="app-viewport">
      {/* === 뒤: 전체 배경 코드비 === */}
      <div className="bg-full">
        <MatrixRain fontSize={16} minSpeed={1.2} maxSpeed={2.6} />
      </div>

      {/* === 앞: 중앙 고정 네모 === */}
      <div className="overlay-center">
        <IntroPane />
      </div>
    </div>
  );
}
