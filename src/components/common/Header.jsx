import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header>
      <nav>
        <Link to="/">Wagy</Link>
        <ul>
          <li><Link to="/">Home</Link></li>
          {/* Add more navigation links here */}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
