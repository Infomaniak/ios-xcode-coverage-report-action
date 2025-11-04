import * as core from "@actions/core";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

try {
    // Read and sanitize the result-bundle input: must be a file path
    const rawInput = core.getInput("result-bundle", { required: true });
    const trimmed = rawInput.trim();

    // Basic safety checks: disallow NULs and newlines which can indicate injection or malformed input
    if (/[\0\r\n]/.test(trimmed)) {
        throw new Error("Invalid result-bundle: contains control characters");
    }

    // Resolve to an absolute path so downstream tools get a canonical path
    const resultBundle = path.resolve(trimmed);

    // Ensure the path exists and is a file or directory
    if (!fs.existsSync(resultBundle)) {
        throw new Error(`result-bundle path does not exist: ${resultBundle}`);
    }
    const stat = fs.statSync(resultBundle);
    if (!stat.isFile() && !stat.isDirectory()) {
        throw new Error(`result-bundle must be a file or directory path: ${resultBundle}`);
    }

    // Run xcrun xccov view command and get JSON output (no shell interpolation)
    // Write JSON output to a temporary file
    const tmpJsonPath = path.join(process.cwd(), "xccov-report.json");
    execFileSync(
        "xcrun",
        ["xccov", "view", "--report", "--json", resultBundle, ">", tmpJsonPath],
        { shell: true }
    );

    // Read and parse the JSON from the file
    const jsonOutput = fs.readFileSync(tmpJsonPath, { encoding: "utf-8" });
    const coverageData = JSON.parse(jsonOutput);

    // Get optional included-targets input
    const includedTargetsRaw = core.getInput("included-targets", { required: false }) || "";
    const includedTargets = includedTargetsRaw.split(",").map(s => s.trim()).filter(Boolean);

    let filteredTargets = coverageData.targets;
    let overallExecutable = 0;
    let overallCovered = 0;

    if (includedTargets.length > 0) {
        filteredTargets = coverageData.targets.filter(t => includedTargets.includes(t.name));
        // Manually compute overall percent covered
        for (const target of filteredTargets) {
            overallExecutable += target.executableLines;
            overallCovered += target.coveredLines;
        }
    } else {
        overallExecutable = coverageData.executableLines;
        overallCovered = coverageData.coveredLines;
    }

    const percentCovered = overallExecutable > 0 ? ((overallCovered / overallExecutable) * 100).toFixed(2) : "0.00";

    let markdown = `# Coverage result\n`;
    markdown += `| Overall Percent Covered | ${percentCovered}% |\n`;
    markdown += `| --- | --- |\n`;
    markdown += `| Executable Lines | ${overallExecutable} |\n`;
    markdown += `| Covered Lines | ${overallCovered} |\n\n`;
    markdown += `# Details\n`;

    // Add details for each filtered target
    for (const target of filteredTargets) {
        const targetPercent = (target.lineCoverage * 100).toFixed(2);
        markdown += `<details>\n\n`;
        markdown += `<summary>${target.name} (${targetPercent}%)</summary>\n\n`;

        // List all files with percent covered in table format
        markdown += `| File | Coverage |\n`;
        markdown += `| --- | --- |\n`;
        for (const file of target.files) {
            const filePercent = (file.lineCoverage * 100).toFixed(2);
            markdown += `| ${file.name} | ${filePercent}% |\n`;
        }

        markdown += `\n</details>\n\n`;
    }

    core.setOutput("report", markdown);
} catch (error) {
    core.setFailed(error.message);
}
