# xcode-coverage-report

This GitHub Action extracts and formats Xcode coverage data from a result bundle using `xcrun xccov`.

## Usage

Add this action to your workflow:

```yaml
- name: Xcode Coverage Report
  uses: Infomaniak/ios-xcode-coverage-report-action@v1
  with:
    result-bundle: path/to/your/Test.xcresult
```

## Inputs

| Name           | Description                                 | Required |
|----------------|---------------------------------------------|----------|
| result-bundle  | Path to the .xcresult file or directory     | Yes      |

## Outputs

| Name   | Description                          |
|--------|--------------------------------------|
| report | Markdown summary of coverage results |

## Example Output

The `report` output contains a markdown summary like:

```
# Coverage result
| Percent covered | 66.74% |
| --- | --- |
| Executable Lines | 14196 |
| Covered Lines | 9475 |

# Details
<details>
<summary>DeviceAssociation (69.29%)</summary>

| File | Coverage |
| --- | --- |
| Capability.swift | 70.00% |

</details>
```

## Requirements
- macOS runner with Xcode installed
- The `xcrun` tool available in PATH

## Troubleshooting
- Ensure the path to your `.xcresult` bundle is correct and accessible.
- The action will fail if the path does not exist or is not a file/directory.
