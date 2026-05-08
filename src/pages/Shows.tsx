import { Card } from 'antd-mobile'
import { useNavigate } from 'react-router-dom'

export default function Shows() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '12px' }}>
      <h2 style={{ marginBottom: '12px' }}>场次记录</h2>
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
  )
}
