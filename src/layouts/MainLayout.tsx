import { Outlet, useNavigate, useLocation } from 'react-router-dom'

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
      // 场次：根路径或 /shows 开头的路径
      return location.pathname === '/' || location.pathname.startsWith('/shows')
    }
    return location.pathname.startsWith(key)
  }

  return (
    <div style={styles.container}>
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
