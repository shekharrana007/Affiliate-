import { FaRocket } from 'react-icons/fa';

function Home(){
    return (
        <div className="home-hero-container">
            <style>{`
                .home-hero-container {
                    min-height: 70vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(120deg, #f8fafc 0%, #e3f0ff 100%);
                    animation: fadeInHero 1.1s cubic-bezier(0.4,0,0.2,1);
                }
                @keyframes fadeInHero {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: none; }
                }
                .home-hero-icon {
                    font-size: 3.5rem;
                    color: #0d6efd;
                    margin-bottom: 1.2rem;
                    filter: drop-shadow(0 2px 8px rgba(13,110,253,0.13));
                }
                .home-hero-title {
                    font-size: 2.8rem;
                    font-weight: 700;
                    color: #222;
                    margin-bottom: 0.7rem;
                    letter-spacing: 1px;
                }
                .home-hero-subtitle {
                    font-size: 1.25rem;
                    color: #555;
                    margin-bottom: 2.2rem;
                    font-weight: 400;
                }
                .home-hero-btn {
                    background: #0d6efd;
                    color: #fff;
                    font-size: 1.15rem;
                    font-weight: 600;
                    border: none;
                    border-radius: 8px;
                    padding: 0.8rem 2.2rem;
                    box-shadow: 0 2px 12px rgba(13,110,253,0.09);
                    transition: background 0.2s, transform 0.2s;
                }
                .home-hero-btn:hover {
                    background: #0b5ed7;
                    transform: translateY(-2px) scale(1.04);
                }
            `}</style>
            <FaRocket className="home-hero-icon" />
            <div className="home-hero-title">Welcome to Affiliate++</div>
            <div className="home-hero-subtitle">
                The easiest way to manage, track, and grow your affiliate marketing campaigns.<br/>
                Join now and supercharge your affiliate journey!
            </div>
            <a href="/register" className="home-hero-btn">Get Started</a>
        </div>
    );
}
export default Home;