import os
import sys
import re

# Run (from first /src folder) As:
# python ./envs/env_tool.py <Env File> [Target Directory (Will use ./build if not provided)]
# Example:
# python ./envs/env_tool.py ./envs/example.env.test ./build

ENVS_DIR = os.path.dirname(__file__)
DEFAULT_BUILD_DIR = os.path.abspath(os.path.join(ENVS_DIR, '..', 'build'))

def parse_env_file(filepath):
    """Parse a .env file into a dict, stripping surrounding quotes from values."""
    env = {}
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            value = value.strip()
            # Remove surrounding single or double quotes
            if (value.startswith("'") and value.endswith("'")) or (value.startswith('"') and value.endswith('"')):
                value = value[1:-1]
            env[key.strip()] = value
    return env

def replace_env_tags_in_text(text, env_vars):
    """Replace %%TAG%% in text with env var value if present."""
    def replacer(match):
        tag = match.group(1)
        return env_vars.get(tag, match.group(0))
    return re.sub(r'%%([A-Z0-9_]+)%%', replacer, text)

def process_files_in_dir(directory, env_vars):
    """Replace tags in all .js, .jsx, .css, and .html files in the directory (recursively)."""
    allowed_exts = {'.js', '.jsx', '.css', '.html'}
    for root, dirs, files in os.walk(directory):
        for fname in files:
            _, ext = os.path.splitext(fname)
            if ext.lower() not in allowed_exts:
                continue
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    content = f.read()
                new_content = replace_env_tags_in_text(content, env_vars)
                if new_content != content:
                    with open(fpath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {fpath}")
            except Exception:
                print(f"Env Engine Processing Error: {fpath}: {e}")
                continue

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python env_tool.py <env_file> [target_dir]")
        sys.exit(1)
    env_file = sys.argv[1]
    target_dir = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_BUILD_DIR

    if not os.path.isfile(env_file):
        print(f"Env file not found: {env_file}")
        sys.exit(1)
    if not os.path.isdir(target_dir):
        print(f"Target directory not found: {target_dir}")
        # Try defaulting to ./build relative to current working directory
        fallback_dir = os.path.abspath(os.path.join(os.getcwd(), 'build'))
        if os.path.isdir(fallback_dir):
            print(f"Defaulting to: {fallback_dir}")
            target_dir = fallback_dir
        else:
            print("No valid build directory found.")
            sys.exit(1)

    env_vars = parse_env_file(env_file)
    process_files_in_dir(target_dir, env_vars)
    print("Done!")