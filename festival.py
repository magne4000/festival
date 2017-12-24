#!/usr/bin/env python3
import argparse

from init import init, check


def handle_args():
    parser = argparse.ArgumentParser(description='Festival')
    parser.add_argument('--start-scanner', action='store_true', help='Start only the scanner process')
    parser.add_argument('--with-scanner', action='store_true', help='Start the scanner process with the webserver')
    parser.add_argument('-c', '--config', help='Path to configuration file. Default to local settings.cfg file')
    parser.add_argument('-d', '--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('-y', '--yes', action='store_true', help='Assume "yes" as answer to all prompts')
    parser.add_argument('--host', default='0.0.0.0', help='On which host to run webserver')
    parser.add_argument('-p', '--port', default=5000, help='On which port to run webserver', type=int)
    parser.add_argument('--check', action='store_true', help='Check Festival integrity')
    parser.add_argument('--test-regex', action='store_true', help='Test SCANNER_FOLDER_PATTERNS option')
    return parser.parse_args()


def simple_main(unattented=False):
    args = handle_args()
    check(args, unattented=unattented)
    return init(args), args


def main():
    myapp, args = simple_main()
    if args.test_regex:
        from scanner import ScannerTestRegex
        ScannerTestRegex(myapp.config).start()
    elif args.start_scanner:
        from scanner import Scanner
        Scanner(myapp.config, debug=args.debug).start()
    elif not args.check:
        if args.with_scanner:
            from scanner import Scanner
            Scanner(myapp.config, debug=args.debug).start()
        myapp.run(host=args.host, port=args.port, debug=args.debug, use_reloader=args.debug and not args.with_scanner)
    else:
        print('OK')

if __name__ == "__main__":
    main()
else:
    app, _ = simple_main(unattented=True)
