const fs = require('fs');

function evaluateReport(report) {
  const findings = [];

  for (const result of report.Results || []) {
    for (const vulnerability of result.Vulnerabilities || []) {
      const severity = String(vulnerability.Severity || '').toUpperCase();
      if (severity === 'HIGH' || severity === 'CRITICAL') {
        findings.push({
          severity,
          id: vulnerability.VulnerabilityID,
          package: vulnerability.PkgName,
          installedVersion: vulnerability.InstalledVersion,
          fixedVersion: vulnerability.FixedVersion || null
        });
      }
    }
  }

  const critical = findings.filter((finding) => finding.severity === 'CRITICAL').length;
  const high = findings.filter((finding) => finding.severity === 'HIGH').length;

  return {
    approved: findings.length === 0,
    critical,
    high,
    findings
  };
}

function main() {
  const reportPath = process.argv[2] || 'trivy-report.json';

  if (!fs.existsSync(reportPath)) {
    console.error(`Security gate failed: ${reportPath} does not exist.`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const result = evaluateReport(report);

  console.log(`Security gate summary: CRITICAL=${result.critical}, HIGH=${result.high}`);

  if (!result.approved) {
    console.error('Security gate BLOCKED the release.');
    for (const finding of result.findings.slice(0, 20)) {
      console.error(
        `- ${finding.severity} ${finding.id} ${finding.package} ` +
        `${finding.installedVersion}${finding.fixedVersion ? ` -> ${finding.fixedVersion}` : ''}`
      );
    }
    process.exit(1);
  }

  console.log('Security gate APPROVED the release.');
}

if (require.main === module) {
  main();
}

module.exports = {
  evaluateReport
};
