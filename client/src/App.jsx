import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Input,
  Layout,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import { InboxOutlined, SendOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

const API = '';

export default function App() {
  const [resumeList, setResumeList] = useState([]);
  const [jdFile, setJdFile] = useState(null);
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const resumeProps = useMemo(
    () => ({
      multiple: true,
      maxCount: 10,
      accept: '.pdf,.docx',
      fileList: resumeList,
      beforeUpload: () => false,
      onChange: ({ fileList }) => setResumeList(fileList),
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

  const submit = async () => {
    const files = resumeList.map((f) => f.originFileObj).filter(Boolean);
    if (!files.length) {
      message.warning('Add at least one resume (PDF or DOCX).');
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
      message.success('Ranking complete');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Rank', dataIndex: 'rank', width: 72 },
    { title: 'File', dataIndex: 'fileName', ellipsis: true },
    {
      title: 'Score',
      dataIndex: 'matchScore',
      width: 90,
      render: (v) => <Tag color={v >= 70 ? 'green' : v >= 40 ? 'gold' : 'red'}>{v}</Tag>,
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      ellipsis: true,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', paddingInline: 24 }}>
        <Title level={4} style={{ color: '#fff', margin: 0 }}>
          Talent ranking engine — PoC
        </Title>
      </Header>
      <Content style={{ padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="Inputs">
            <Paragraph type="secondary">
              Upload 8–10 resumes (PDF/DOCX) and one job description (paste text and/or upload
              PDF/DOCX). Results call OpenAI in parallel and return the top 10.
            </Paragraph>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Text strong>Resumes</Text>
                <Dragger {...resumeProps} style={{ marginTop: 8 }}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag resumes here</p>
                  <p className="ant-upload-hint">Up to 10 files, PDF or DOCX</p>
                </Dragger>
              </Col>
              <Col xs={24} lg={12}>
                <Text strong>Job description file (optional if you paste text)</Text>
                <Dragger {...jdUploadProps} style={{ marginTop: 8 }}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">JD as PDF, DOCX, or TXT</p>
                </Dragger>
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Text strong>Job description (plain text)</Text>
              <Input.TextArea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={6}
                placeholder="Paste the full job description here…"
                style={{ marginTop: 8 }}
              />
            </div>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading}
              onClick={submit}
              style={{ marginTop: 16 }}
            >
              Rank candidates
            </Button>
          </Card>

          {result && (
            <Card title="Results">
              <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Resumes processed">
                  {result.meta?.resumeCount} ({result.meta?.parsedOk} parsed OK)
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {result.meta?.durationMs} ms
                </Descriptions.Item>
                <Descriptions.Item label="JD preview">
                  {result.jobDescription?.preview}
                </Descriptions.Item>
              </Descriptions>
              <Table
                rowKey={(r) => `${r.rank}-${r.fileName}`}
                columns={columns}
                dataSource={result.candidates}
                pagination={false}
                expandable={{
                  expandedRowRender: (row) => (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {row.parseError && <Text type="danger">Parse/score note: {row.parseError}</Text>}
                      <div>
                        <Text strong>Strengths: </Text>
                        <Text>{(row.strengths || []).join(' · ') || '—'}</Text>
                      </div>
                      <div>
                        <Text strong>Gaps: </Text>
                        <Text>{(row.gaps || []).join(' · ') || '—'}</Text>
                      </div>
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
