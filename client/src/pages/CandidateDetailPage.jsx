/**
 * Candidate profile: hydrates from React Router `location.state` or `sessionStorage` (`rankSnapshot`)
 * so refresh/deep link still works after a rank run in the same browser session.
 */
import { ArrowLeftOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Grid,
  Layout,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { findCandidateById } from '../lib/rankSnapshot.js';
import {
  appHeaderStyle,
  descriptionsLabelStyle,
  detailContentStyle,
  fontFamily,
  fontSize,
  headerLinkStyle,
  headerTitleStyle,
  layout,
  pageLayoutStyle,
  space,
} from '../theme/index.js';

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function CandidateDetailPage() {
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens.md;

  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromState = location.state?.candidate;

  const [candidate, setCandidate] = useState(fromState);

  /** Prefer router state; fall back to last rank snapshot in sessionStorage. */
  useEffect(() => {
    if (fromState?.id === id) {
      setCandidate(fromState);
      return;
    }
    const found = id ? findCandidateById(id) : null;
    setCandidate(found);
  }, [id, fromState]);

  const title = useMemo(() => {
    if (!candidate) return 'Candidate';
    const name = (candidate.fullName || '').trim();
    return name || candidate.fileName || 'Candidate';
  }, [candidate]);

  if (!candidate) {
    return (
      <Layout style={pageLayoutStyle()}>
        <Header style={appHeaderStyle({ isMdUp })}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Title level={4} style={{ ...headerTitleStyle, flex: 'none' }}>
            Candidate
          </Title>
        </Header>
        <Content
          style={detailContentStyle({ isMdUp, maxWidth: layout.contentMaxMd })}
        >
          <Empty description="No candidate data. Run ranking again from the home screen." />
          <div style={{ textAlign: 'center', marginTop: space[4] }}>
            <Link to="/">Go to home</Link>
          </div>
        </Content>
      </Layout>
    );
  }

  const files = [candidate.fileName, ...(candidate.sourceFiles || [])].filter(Boolean);
  const uniqueFiles = [...new Set(files)];

  return (
    <Layout style={pageLayoutStyle({ withMutedBackground: true })}>
      <Header style={appHeaderStyle({ isMdUp })}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ color: headerTitleStyle.color }}
        >
          Back
        </Button>
        <Title level={4} style={headerTitleStyle} ellipsis>
          {title}
        </Title>
        <Link to="/" style={headerLinkStyle}>
          Home
        </Link>
      </Header>
      <Content style={detailContentStyle({ isMdUp, maxWidth: layout.contentMaxMd })}>
        <Space direction="vertical" size={space[6]} style={{ width: '100%' }}>
          <Card>
            <Space wrap size={space[3]} style={{ marginBottom: space[4] }}>
              <Tag color="blue">Rank #{candidate.rank ?? '—'}</Tag>
              <Tag color={candidate.matchScore >= 70 ? 'green' : candidate.matchScore >= 40 ? 'gold' : 'red'}>
                Score {candidate.matchScore ?? '—'}
              </Tag>
              {candidate.yearsOfExperience > 0 && (
                <Tag>{candidate.yearsOfExperience} yrs experience</Tag>
              )}
            </Space>
            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, sm: 1, md: 2 }}
              labelStyle={descriptionsLabelStyle}
            >
              <Descriptions.Item label="Full name">
                {(candidate.fullName || '').trim() || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Current title">
                {(candidate.currentTitle || '').trim() || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {(candidate.email || '').trim() ? (
                  <a href={`mailto:${candidate.email}`}>
                    <MailOutlined /> {candidate.email}
                  </a>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {(candidate.phone || '').trim() ? (
                  <a href={`tel:${candidate.phone}`}>
                    <PhoneOutlined /> {candidate.phone}
                  </a>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Source file(s)" span={2}>
                {uniqueFiles.join(' · ') || '—'}
              </Descriptions.Item>
              {candidate.parseError && (
                <Descriptions.Item label="Parse / score" span={2}>
                  <Text type="danger">{candidate.parseError}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Fit summary">
            <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
              {candidate.summary || '—'}
            </Paragraph>
          </Card>

          <Card title="Strengths">
            <Space wrap size={[space[2], space[2]]}>
              {(candidate.strengths || []).length ? (
                candidate.strengths.map((s) => (
                  <Tag key={s} color="green">
                    {s}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Space>
          </Card>

          <Card title="Gaps vs job description">
            <Space wrap size={[space[2], space[2]]}>
              {(candidate.gaps || []).length ? (
                candidate.gaps.map((s) => (
                  <Tag key={s} color="orange">
                    {s}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">None listed</Text>
              )}
            </Space>
          </Card>

          {(candidate.resumeExcerpt || '').trim() ? (
            <Card title="Resume excerpt (parsed text)">
              <Paragraph
                style={{
                  marginBottom: 0,
                  fontFamily: fontFamily.mono,
                  fontSize: fontSize.sm,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {candidate.resumeExcerpt}
              </Paragraph>
            </Card>
          ) : null}
        </Space>
      </Content>
    </Layout>
  );
}
