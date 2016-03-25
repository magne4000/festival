#!/usr/bin/env python3
import argparse
from init import init, check


def handle_args():
    parser = argparse.ArgumentParser(description='Festival')
    parser.add_argument('--with-scanner', action='store_true', help='Start the scanner process with the webserver')
    parser.add_argument('-d', '--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('-y', '--yes', action='store_true', help='Assume "yes" as answer to all prompts')
    parser.add_argument('--host', default='0.0.0.0', help='On which host to run webserver')
    parser.add_argument('--check', action='store_true', help='Check Festival integrity')
    parser.add_argument('--test-regex', action='store_true', help='Test SCANNER_FOLDER_PATTERNS option')
    return parser.parse_args()


def main():
    args = handle_args()
    check(args)
    app = init()
    from scanner import Scanner, ScannerTestRegex
    if args.test_regex:
        ScannerTestRegex(app.config['SCANNER_PATH']).start()
    elif not args.check:
        if args.with_scanner:
            Scanner(app.config['SCANNER_PATH'], debug=args.debug).start()
        app.run(host=args.host, debug=args.debug, use_reloader=args.debug and not args.with_scanner)
    else:
        print('OK')

if __name__ == "__main__":
    main()
else:
    check(unattented=True)
    app = init()