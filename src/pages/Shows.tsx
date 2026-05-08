import { NavBar, Card } from 'antd-mobile'
import { FilterOutline, AddCircleOutline, SearchOutline } from 'antd-mobile-icons'
import { useNavigate } from 'react-router-dom'

export default function Shows() {
  const navigate = useNavigate()

  return (
    <div>
      <NavBar
        left={<FilterOutline fontSize={20} />}
        right={
          <div style={{ display: 'flex', gap: '12px' }}>
            <SearchOutline fontSize={20} />
            <AddCircleOutline fontSize={20} />
          </div>
        }
        style={{ '--height': '44px', background: '#fff' }}
      >
        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>场次记录</span>
      </NavBar>

      <div style={{ padding: '12px' }}>
        <Card
          onClick={() => navigate('/shows/1')}
          style={{ marginBottom: '12px' }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              width: '60px',
              height: '80px',
              background: '#f0f0f0',
              borderRadius: '4px'
            }} />
            <div>
              <div style={{ fontWeight: 'bold' }}>示例剧目</div>
              <div style={{ color: '#999', fontSize: '12px' }}>2024-01-01 19:30</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
