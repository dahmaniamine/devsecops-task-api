const { evaluateReport } = require('../scripts/security-gate');

describe('security gate', () => {
  test('approves a report without HIGH or CRITICAL vulnerabilities', () => {
    const result = evaluateReport({
      Results: [
        {
          Vulnerabilities: [
            { Severity: 'LOW', VulnerabilityID: 'CVE-LOW', PkgName: 'demo' }
          ]
        }
      ]
    });

    expect(result.approved).toBe(true);
    expect(result.critical).toBe(0);
    expect(result.high).toBe(0);
  });

  test('blocks a report containing a HIGH vulnerability', () => {
    const result = evaluateReport({
      Results: [
        {
          Vulnerabilities: [
            {
              Severity: 'HIGH',
              VulnerabilityID: 'CVE-TEST-1',
              PkgName: 'demo',
              InstalledVersion: '1.0.0',
              FixedVersion: '1.0.1'
            }
          ]
        }
      ]
    });

    expect(result.approved).toBe(false);
    expect(result.high).toBe(1);
    expect(result.critical).toBe(0);
  });
});
