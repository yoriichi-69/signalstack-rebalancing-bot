import SignalIcon from '../../assets/icons/signal-icon.svg';
// import AnalyticsIcon from '../../assets/icons/analytics-icon.svg';
// import NewsIcon from '../../assets/icons/news-icon.svg';
import BotsIcon from '../../assets/icons/bots-icon.svg';
import MarketIcon from '../../assets/icons/market-icon.svg';
import MoonIcon from '../../assets/icons/moon-icon.svg';

const navLinks = [
  { id: 'dashboard', text: 'Dashboard', icon: DashboardIcon, route: '/dashboard' },
  { id: 'portfolio', text: 'Portfolio', icon: PortfolioIcon, route: '/portfolio' },
  { id: 'signals', text: 'Signals', icon: SignalIcon, route: '/signals' },
  // { id: 'analytics', text: 'Analytics', icon: AnalyticsIcon, route: '/analytics' },
  // { id: 'news', text: 'News', icon: NewsIcon, route: '/news' },
  { id: 'bots', text: 'Bots', icon: BotsIcon, route: '/bots' },
  { id: 'market', text: 'Market', icon: MarketIcon, route: '/market' }
];

const [isDropdownOpen, setDropdownOpen] = useState(false); 