import re
import sys

def extract_summary_from_stream(stream):
    cpu_line = None
    mem_line = None

    for line in stream:
        if "Cpu limit" in line and "used" in line:
            cpu_line = line.strip()
        elif "Mem limit" in line and "used" in line:
            mem_line = line.strip()
        if cpu_line and mem_line:
            break

    return cpu_line, mem_line

def generate_markdown(cpu_line, mem_line):
    if not cpu_line and not mem_line:
        return "No cost data found in test output."

    lines = ["| Metric | Value |", "|--------|-------|"]
    if cpu_line:
        used = re.search(r"used: (\d+)", cpu_line)
        lines.append(f"| CPU used | {used.group(1) if used else 'N/A'} |")
    if mem_line:
        used = re.search(r"used: (\d+)", mem_line)
        lines.append(f"| Memory used | {used.group(1) if used else 'N/A'} |")
    return "\n".join(lines)

if __name__ == "__main__":
    cpu, mem = extract_summary_from_stream(sys.stdin)
    print(generate_markdown(cpu, mem))
