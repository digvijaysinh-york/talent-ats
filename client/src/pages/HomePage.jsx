/**
 * Home screen: multipart upload to `/api/v1/rank`, optional HR experience band + strict filter,
 * results table with pagination, navigation to candidate detail. Uses design tokens for layout.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Grid,
  Input,
  InputNumber,
  Layout,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import { EyeOutlined, InboxOutlined, SendOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { previewScoringTemperature } from '../lib/experienceTemperature.js';
import { MAX_RESUMES_PER_REQUEST } from '../lib/limits.js';
import { loadLastRankPayload, saveLastRankPayload } from '../lib/rankSnapshot.js';
import {
  appContentStyle,
  appHeaderStyle,
  fontSize,
  gridGutter,
  headerTitleStyle,
  layout,
  space,
} from '../theme/index.js';
import '../styles/uploadTiles.css';

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

const API = '';

export default function HomePage() {
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens.md;

  const [resumeList, setResumeList] = useState([]);
  const [jdFile, setJdFile] = useState(null);
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [experienceMin, setExperienceMin] = useState(null);
  const [experienceMax, setExperienceMax] = useState(null);
  const [strictExperienceFilter, setStrictExperienceFilter] = useState(false);

  /** Restore ranked results after visiting candidate detail (Home unmounts; snapshot remains in sessionStorage). */
  useEffect(() => {
    const saved = loadLastRankPayload();
    if (saved && Array.isArray(saved.candidates) && saved.candidates.length > 0) {
      setResult(saved);
    }
  }, []);

  const tempPreview = useMemo(
    () => previewScoringTemperature(experienceMin, experienceMax),
    [experienceMin, experienceMax]
  );

  const resumeProps = useMemo(
    () => ({
      multiple: true,
      accept: '.pdf,.docx,.jpg,.jpeg,.png,.webp',
      fileList: resumeList,
      beforeUpload: () => false,
      onChange: ({ fileList }) => {
        if (fileList.length > MAX_RESUMES_PER_REQUEST) {
          message.warning(
            `You can attach up to ${MAX_RESUMES_PER_REQUEST} resumes per run. Extra files were not added.`
          );
        }
        setResumeList(fileList.slice(0, MAX_RESUMES_PER_REQUEST));
      },
    }),
    [resumeList]
  );

  const jdUploadProps = useMemo(
    () => ({
      maxCount: 1,
      accept: '.pdf,.docx,.txt',
      fileList: jdFile ? [jdFile] : [],
      beforeUpload: () => false,
      onChange: ({ fileList }) => setJdFile(fileList[0] || null),
    }),
    [jdFile]
  );

  /** Validates inputs, builds `FormData`, POSTs rank API, stores snapshot for detail routes. */
  const submit = async () => {
    const files = resumeList.map((f) => f.originFileObj).filter(Boolean);
    if (!files.length) {
      message.warning('Add at least one resume (PDF, DOCX, or image: JPEG/PNG/WebP).');
      return;
    }
    const jdFromFile = jdFile?.originFileObj;
    const trimmed = jdText.trim();
    if (!trimmed && !jdFromFile) {
      message.warning('Provide a job description as text or upload a file.');
      return;
    }

    const form = new FormData();
    files.forEach((file) => form.append('resumes', file));
    if (trimmed) form.append('jobDescriptionText', trimmed);
    if (jdFromFile) form.append('jobDescription', jdFromFile);

    if (experienceMin != null && experienceMin !== '') {
      form.append('experienceMin', String(experienceMin));
    }
    if (experienceMax != null && experienceMax !== '') {
      form.append('experienceMax', String(experienceMax));
    }
    if (strictExperienceFilter) {
      form.append('strictExperienceFilter', 'true');
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/api/v1/rank`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || res.statusText || 'Request failed');
      }
      setResult(data);
      saveLastRankPayload(data);
      message.success('Ranking complete');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      { title: 'Rank', dataIndex: 'rank', width: 64, fixed: 'left' },
      {
        title: 'Candidate',
        key: 'who',
        ellipsis: true,
        render: (_, row) => (
          <Space direction="vertical" size={space[0]}>
            <Text
              strong
              ellipsis
              style={{
                maxWidth: isMdUp ? layout.candidateCellMaxMd : layout.candidateCellMaxSm,
              }}
            >
              {(row.fullName || '').trim() || row.fileName}
            </Text>
            {!!(row.email || '').trim() && (
              <Text
                type="secondary"
                ellipsis
                style={{
                  fontSize: fontSize.xs,
                  maxWidth: isMdUp ? layout.candidateCellMaxMd : layout.candidateCellMaxSm,
                }}
              >
                {row.email}
              </Text>
            )}
          </Space>
        ),
      },
      ...(isMdUp
        ? [
            {
              title: 'File',
              dataIndex: 'fileName',
              ellipsis: true,
              width: 160,
            },
          ]
        : []),
      {
        title: 'Yrs exp.',
        dataIndex: 'yearsOfExperience',
        width: 72,
        render: (v) => (v > 0 ? v : '—'),
      },
      {
        title: 'Score',
        dataIndex: 'matchScore',
        width: 84,
        render: (v) => (
          <Tag color={v >= 70 ? 'green' : v >= 40 ? 'gold' : 'red'}>{v}</Tag>
        ),
      },
      ...(isMdUp
        ? [
            {
              title: 'Summary',
              dataIndex: 'summary',
              ellipsis: true,
            },
          ]
        : []),
      {
        title: '',
        key: 'actions',
        width: 88,
        fixed: 'right',
        render: (_, row) => (
          <Link to={`/candidates/${row.id}`} state={{ candidate: row }}>
            <Button type="link" size="small" icon={<EyeOutlined />}>
              {isMdUp ? 'Details' : ''}
            </Button>
          </Link>
        ),
      },
    ],
    [isMdUp]
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={appHeaderStyle({ isMdUp })}>
        <Title level={isMdUp ? 4 : 5} style={headerTitleStyle} ellipsis>
          Talent ranking — PoC
        </Title>
      </Header>
      <Content style={appContentStyle({ isMdUp, maxWidth: layout.contentMaxLg })}>
        <Space direction="vertical" size={space[6]} style={{ width: '100%' }}>
          <Card title="Upload resumes & job description">
            <Paragraph type="secondary" style={{ marginBottom: space[4] }}>
              Add one or many résumés (PDF, DOCX, or JPEG/PNG/WebP screenshots). Scanned PDFs with no
              text are rasterized server-side and scored with vision. One job description (paste below
              and/or upload a file — not an image). Résumés are scored in parallel; duplicate people
              (same email or phone) are merged. Up to {MAX_RESUMES_PER_REQUEST} files per request.
            </Paragraph>
            <Row gutter={gridGutter} align="stretch" wrap>
              <Col
                xs={24}
                lg={12}
                style={{
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: 'stretch',
                }}
              >
                <Text strong>Candidate resumes</Text>
                <Dragger
                  {...resumeProps}
                  className="talent-upload-tile"
                  style={{ marginTop: space[2], width: '100%', flex: 1, minHeight: 0 }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag files here — add as many as you need</p>
                  <p className="ant-upload-hint">
                    PDF, DOCX, JPEG, PNG, or WebP · max {MAX_RESUMES_PER_REQUEST} files per run
                  </p>
                </Dragger>
              </Col>
              <Col
                xs={24}
                lg={12}
                style={{
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: 'stretch',
                }}
              >
                <Text strong>Job description file (optional if you paste below)</Text>
                <Dragger
                  {...jdUploadProps}
                  className="talent-upload-tile"
                  style={{ marginTop: space[2], width: '100%', flex: 1, minHeight: 0 }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">JD as PDF, DOCX, or TXT</p>
                  <p className="ant-upload-hint">One file · optional if you paste the JD below</p>
                </Dragger>
              </Col>
            </Row>
            <Row gutter={gridGutter} style={{ marginTop: space[6] }}>
              <Col span={24} style={{ minWidth: 0 }}>
                <Text strong>Job description — paste text here</Text>
                <Input.TextArea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={isMdUp ? 6 : 5}
                  placeholder="Paste the role title, requirements, and any must-haves from your job posting…"
                  style={{ marginTop: space[2], width: '100%', display: 'block' }}
                />
              </Col>
            </Row>

            <Card
              type="inner"
              title="Optional: preferred years of experience"
              style={{ marginTop: space[5] }}
            >
              <Paragraph type="secondary" style={{ marginTop: 0 }}>
                Use this when the role has a clear seniority range (for example “3–7 years”). Leave both
                fields empty if you do not want to steer the model. How wide or narrow your range is
                also adjusts how strictly the AI scores each resume (shown below as a technical
                “temperature” — you can ignore the number; narrower ranges tend to behave more
                consistently).
              </Paragraph>
              <Row gutter={gridGutter} style={{ marginTop: space[2] }}>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Minimum years of experience</Text>
                  <Paragraph type="secondary" style={{ marginBottom: space[2], marginTop: space[1] }}>
                    Lowest years you would still consider. Leave empty for no minimum.
                  </Paragraph>
                  <InputNumber
                    min={0}
                    max={40}
                    placeholder="No minimum"
                    value={experienceMin}
                    onChange={setExperienceMin}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Maximum years of experience</Text>
                  <Paragraph type="secondary" style={{ marginBottom: space[2], marginTop: space[1] }}>
                    Ceiling for the range (e.g. avoid over-qualified profiles). Leave empty for no
                    maximum.
                  </Paragraph>
                  <InputNumber
                    min={0}
                    max={40}
                    placeholder="No maximum"
                    value={experienceMax}
                    onChange={setExperienceMax}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Text strong>Limit results to this experience range</Text>
                  <Paragraph type="secondary" style={{ marginBottom: space[2], marginTop: space[1] }}>
                    When on, candidates whose résumé shows a clear year count outside your range are
                    hidden from the ranked list. If we could not read years from a résumé, we still
                    show that person.
                  </Paragraph>
                  <div>
                    <Switch checked={strictExperienceFilter} onChange={setStrictExperienceFilter} />
                    <Text type="secondary" style={{ marginLeft: space[2] }}>
                      Apply range filter to results
                    </Text>
                  </div>
                </Col>
              </Row>
              <Alert
                style={{ marginTop: space[4] }}
                type="info"
                showIcon
                message={
                  <span>
                    Scoring calibration: AI temperature ≈ <Text strong>{tempPreview.temperature}</Text>
                    {tempPreview.bandMin != null || tempPreview.bandMax != null ? (
                      <>
                        {' '}
                        for your range{' '}
                        <Text code>
                          {tempPreview.bandMin ?? '—'}–{tempPreview.bandMax ?? '—'} years
                        </Text>{' '}
                        (width {tempPreview.spanYears} years)
                      </>
                    ) : (
                      <span> — default settings (no range entered)</span>
                    )}
                  </span>
                }
              />
            </Card>

            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading}
              onClick={submit}
              style={{ marginTop: space[5] }}
              block={!isMdUp}
              size="large"
            >
              Analyze &amp; rank candidates
            </Button>
          </Card>

          {result && (
            <Card title="Results — ranked candidates">
              <Descriptions
                size="small"
                column={{ xs: 1, sm: 1, md: 2 }}
                bordered
                style={{ marginBottom: space[4] }}
              >
                <Descriptions.Item label="Résumés uploaded">
                  {result.meta?.resumeCount} total · {result.meta?.parsedOk ?? '—'} parsed successfully
                </Descriptions.Item>
                <Descriptions.Item label="People in ranking (after deduplication)">
                  {result.meta?.uniqueAfterDedupe ?? '—'} unique · {result.meta?.scoredCount ?? '—'}{' '}
                  scored
                </Descriptions.Item>
                <Descriptions.Item label="Time to complete">
                  {result.meta?.durationMs != null ? `${result.meta.durationMs} ms` : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="AI scoring calibration (temperature)">
                  {result.meta?.scoringTemperature ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Experience range used for scoring">
                  {result.meta?.experienceBand?.min ?? '—'} – {result.meta?.experienceBand?.max ?? '—'}{' '}
                  years (band width {result.meta?.experienceBand?.spanYears ?? '—'} years)
                </Descriptions.Item>
                <Descriptions.Item label="Results limited to experience range">
                  {result.meta?.strictExperienceFilter ? 'Yes' : 'No'}
                </Descriptions.Item>
                <Descriptions.Item label="Job description preview" span={{ xs: 1, md: 2 }}>
                  {result.jobDescription?.preview}
                </Descriptions.Item>
              </Descriptions>
              <Table
                rowKey={(r) => r.id || `${r.rank}-${r.fileName}`}
                columns={columns}
                dataSource={result.candidates}
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  pageSizeOptions: [10, 15, 25, 50],
                  showTotal: (total, range) =>
                    `${range[0]}–${range[1]} of ${total} candidates`,
                }}
                scroll={{
                  x: isMdUp ? layout.tableScrollWide : layout.tableScrollCompact,
                }}
                size={isMdUp ? 'middle' : 'small'}
                expandable={{
                  expandedRowRender: (row) => (
                    <Space direction="vertical" size={space[2]} style={{ width: '100%' }}>
                      {row.parseError && (
                        <Text type="danger">Could not read or score this file: {row.parseError}</Text>
                      )}
                      <div>
                        <Text strong>Strengths: </Text>
                        <Text>{(row.strengths || []).join(' · ') || '—'}</Text>
                      </div>
                      <div>
                        <Text strong>Gaps: </Text>
                        <Text>{(row.gaps || []).join(' · ') || '—'}</Text>
                      </div>
                      <Link to={`/candidates/${row.id}`} state={{ candidate: row }}>
                        Open full candidate profile →
                      </Link>
                    </Space>
                  ),
                }}
              />
            </Card>
          )}
        </Space>
      </Content>
    </Layout>
  );
}
