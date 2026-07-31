import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from '../lib/supabase'

const tabs = [
  { key: '/', title: '场次', icon: 'theater_comedy' },
  { key: '/musicals', title: '剧目', icon: 'menu_book' },
  { key: '/artists', title: '演员', icon: 'person' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActiveTab = (key: string) => {
    if (key === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/shows')
    }
    return location.pathname.startsWith(key)
  }

  const handleLogout = async () => {
    await signOut()
  }

  // 判断是否在主页面（显示顶部退出按钮）
  const isMainPage = location.pathname === '/' || location.pathname === '/musicals' || location.pathname === '/artists'

  return (
    <div style={styles.container}>
      {isMainPage && (
        <button style={styles.logoutBtn} onClick={handleLogout}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
        </button>
      )}
      <Outlet />
      <nav style={styles.navBar}>
        {tabs.map(tab => {
          const isActive = isActiveTab(tab.key)
          return (
            <a
              key={tab.key}
              style={isActive ? styles.navItemActive : styles.navItem}
              onClick={() => navigate(tab.key)}
            >
              <span
                className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}
                style={isActive ? styles.iconActive : styles.icon}
              >
                {tab.icon}
              </span>
              <span style={isActive ? styles.labelActive : styles.label}>{tab.title}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    paddingBottom: '80px'
  },
  logoutBtn: {
    position: 'fixed',
    top: '18px',
    right: '60px',
    zIndex: 41,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#707979',
    cursor: 'pointer',
    borderRadius: '50%'
  },
  navBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    zIndex: 50,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '6px 16px',
    backgroundColor: '#ffffff',
    borderRadius: '16px 16px 0 0',
    boxShadow: '0 -4px 20px rgba(53, 102, 104, 0.08)'
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    color: '#404848',
    cursor: 'pointer',
    transition: 'color 0.2s'
  },
  navItemActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 24px',
    backgroundColor: '#a8dadc',
    borderRadius: '9999px',
    color: '#356668',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(53, 102, 104, 0.12)',
    transition: 'all 0.3s'
  },
  icon: {
    fontSize: '24px'
  },
  iconActive: {
    fontSize: '24px'
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    marginTop: '2px'
  },
  labelActive: {
    fontSize: '12px',
    fontWeight: 700,
    marginTop: '2px'
  }
}
