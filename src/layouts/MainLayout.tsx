import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import {
  AppstoreOutline,
  VideoOutline,
  UserOutline,
  CalendarOutline,
  PieOutline
} from 'antd-mobile-icons'

const tabs = [
  { key: '/', title: '场次', icon: <AppstoreOutline /> },
  { key: '/musicals', title: '剧目', icon: <VideoOutline /> },
  { key: '/artists', title: '演员', icon: <UserOutline /> },
  { key: '/calendar', title: '日历', icon: <CalendarOutline /> },
  { key: '/stats', title: '统计', icon: <PieOutline /> },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{ minHeight: '100vh' }}>
      <Outlet />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <TabBar activeKey={location.pathname} onChange={value => navigate(value)}>
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div>
  )
}
