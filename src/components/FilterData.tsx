import { AstarteInterfaceValues } from 'astarte-client';
import React, { useEffect, useState } from 'react';
import { Button, Form, Col, Row, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface FilterDataProps {
  data: AstarteInterfaceValues | null;
  fetchData?: (path?: string, since?: string, to?: string) => void;
  requestingData?: boolean;
}

const FilterData = ({ data, fetchData, requestingData }: FilterDataProps): React.ReactElement => {
  const [fromTime, setFromTime] = useState<Date | null>(null);
  const [toTime, setToTime] = useState<Date | null>(null);
  const [path, setPath] = useState<string>('');
  const [paths, setPaths] = useState<string[]>([]);

  const extractPaths = (data: AstarteInterfaceValues): string[] => {
    const result: string[] = [];

    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const firstValue = data[firstKey];
        if (
          typeof data[firstKey] === 'object' &&
          firstValue !== null &&
          !Array.isArray(data[firstKey])
        ) {
          const subKey = Object.keys(firstValue);
          if (subKey) {
            result.push(`/${firstKey}/${subKey}`);
          }
        } else {
          result.push(`/${firstKey}`);
        }
      }
    }

    return result;
  };

  const handleFetchData = async () => {
    if (fetchData) {
      const since = fromTime ? fromTime.toISOString() : new Date(0).toISOString();
      const to = toTime ? toTime.toISOString() : new Date().toISOString();
      fetchData(path, since, to);
    }
  };

  useEffect(() => {
    if (data) {
      const extractedPaths = extractPaths(data);
      setPaths(extractedPaths);
    }
  }, [data]);

  return (
    <>
      <Row className="mb-4">
        <Col xs={12} md={3} className="mb-2 mb-md-0">
          <Form.Group controlId="formPath" className="d-flex align-items-center">
            <Form.Label className="me-2 mb-0">Path</Form.Label>
            <Form.Control as="select" value={path} onChange={(e) => setPath(e.target.value)}>
              <option value="">Select path</option>
              {paths.map((pathOption) => (
                <option key={pathOption} value={pathOption}>
                  {pathOption}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
        <Col
          xs={12}
          md={6}
          className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-2 mb-md-0"
        >
          <Form.Group
            controlId="formFromTime"
            className="d-flex align-items-center mb-2 mb-md-0 me-md-2"
          >
            <Form.Label className="me-2 mb-0">From</Form.Label>
            <DatePicker
              selected={fromTime}
              onChange={(date: Date) => setFromTime(date)}
              showTimeSelect
              dateFormat="Pp"
              className="form-control"
              placeholderText="Select from time"
            />
          </Form.Group>
          <Form.Group
            controlId="formToTime"
            className="d-flex align-items-center mb-2 mb-md-0 me-md-2"
          >
            <Form.Label className="me-2 mb-0">To</Form.Label>
            <DatePicker
              selected={toTime}
              onChange={(date: Date) => setToTime(date)}
              showTimeSelect
              dateFormat="Pp"
              className="form-control"
              placeholderText="Select to time"
            />
          </Form.Group>
          <Button variant="primary" onClick={handleFetchData} disabled={requestingData}>
            {requestingData ? <Spinner size="sm" animation="border" /> : 'Filter Data'}
          </Button>
        </Col>
      </Row>
    </>
  );
};

export default FilterData;
