import re
import sys
from collections import defaultdict


def extract_summary_from_stream(stream):
    cpu_measurements = []
    mem_measurements = []
    operation_costs = defaultdict(lambda: {"cpu": 0, "mem": 0})

    current_operation = None

    for line in stream:
        # Look for operation labels
        if "Cost Estimate -" in line:
            current_operation = line.split("Cost Estimate -")[1].strip()

        # Extract CPU usage
        if "Cpu limit" in line and "used" in line:
            cpu_match = re.search(r"used: (\d+)", line)
            if cpu_match:
                cpu_used = int(cpu_match.group(1))
                cpu_measurements.append(cpu_used)
                if current_operation:
                    operation_costs[current_operation]["cpu"] = cpu_used

        # Extract memory usage
        elif "Mem limit" in line and "used" in line:
            mem_match = re.search(r"used: (\d+)", line)
            if mem_match:
                mem_used = int(mem_match.group(1))
                mem_measurements.append(mem_used)
                if current_operation:
                    operation_costs[current_operation]["mem"] = mem_used
                    current_operation = None  # Reset after collecting both CPU and mem

    return cpu_measurements, mem_measurements, operation_costs


def generate_markdown(cpu_measurements, mem_measurements, operation_costs):
    if not cpu_measurements and not mem_measurements:
        return "No cost data found in test output."

    lines = []

    # Overall summary
    if cpu_measurements and mem_measurements:
        total_cpu = sum(cpu_measurements)
        total_mem = sum(mem_measurements)
        max_cpu = max(cpu_measurements)
        max_mem = max(mem_measurements)
        avg_cpu = total_cpu / len(cpu_measurements)
        avg_mem = total_mem / len(mem_measurements)

        lines.extend(
            [
                "## 📊 Soroban Cost Estimation Summary",
                "",
                "| Metric | Total | Maximum | Average | Count |",
                "|--------|-------|---------|---------|-------|",
                f"| CPU Instructions | {total_cpu:,} | {max_cpu:,} | {avg_cpu:,.0f} | {len(cpu_measurements)} |",
                f"| Memory Bytes | {total_mem:,} | {max_mem:,} | {avg_mem:,.0f} | {len(mem_measurements)} |",
                "",
            ]
        )

    # Per-operation breakdown
    if operation_costs:
        lines.extend(
            [
                "## 🔧 Cost Breakdown by Operation",
                "",
                "| Operation | CPU Instructions | Memory Bytes |",
                "|-----------|------------------|--------------|",
            ]
        )

        # Sort operations by CPU usage (highest first)
        sorted_ops = sorted(
            operation_costs.items(), key=lambda x: x[1]["cpu"], reverse=True
        )

        for operation, costs in sorted_ops:
            lines.append(f"| {operation} | {costs['cpu']:,} | {costs['mem']:,} |")

        lines.append("")

    # Performance indicators
    if cpu_measurements:
        cpu_efficiency = (
            max(cpu_measurements) / 100_000_000
        ) * 100  # Percentage of CPU limit
        mem_efficiency = (
            max(mem_measurements) / 41_943_040
        ) * 100  # Percentage of memory limit

        lines.extend(
            [
                "## ⚡ Resource Utilization",
                "",
                f"- **CPU Utilization**: {cpu_efficiency:.2f}% of limit",
                f"- **Memory Utilization**: {mem_efficiency:.2f}% of limit",
                "",
            ]
        )

        # Add performance warnings
        if cpu_efficiency > 50:
            lines.append(
                "⚠️ **High CPU usage detected** - Consider optimizing computational complexity"
            )
        if mem_efficiency > 50:
            lines.append(
                "⚠️ **High memory usage detected** - Consider optimizing data structures"
            )
        if cpu_efficiency <= 10 and mem_efficiency <= 10:
            lines.append(
                "✅ **Excellent resource efficiency** - Low resource consumption"
            )

    return "\n".join(lines)


if __name__ == "__main__":
    cpu_measurements, mem_measurements, operation_costs = extract_summary_from_stream(
        sys.stdin
    )
    print(generate_markdown(cpu_measurements, mem_measurements, operation_costs))
