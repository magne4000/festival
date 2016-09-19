#!/usr/bin/env python3
import argparse

from init import init, check


def handle_args():
    parser = argparse.ArgumentParser(description='Festival')
    parser.add_argument('-c', '--config', help='Path to configuration file. Default to local settings.cfg file')
    parser.add_argument('-d', '--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('-y', '--yes', action='store_true', help='Assume "yes" as answer to all prompts')
    subparsers = parser.add_subparsers(dest='action')
    subparsers.required = True
    # check
    parser_check = subparsers.add_parser('check', help='Check Festival integrity')
    # test-regex
    parser_test_regex = subparsers.add_parser('test-regex', help='Test SCANNER_FOLDER_PATTERNS option')
    # start
    parser_start = subparsers.add_parser('start', help='Start embedded webserver')
    parser_start.add_argument('--host', default='0.0.0.0', help='On which host to run webserver')
    parser_start.add_argument('-p', '--port', default=5000, help='On which port to run webserver', type=int)
    parser_start.add_argument('--with-scanner', action='store_true', help='Start the scanner process with the webserver')
    # start-scanner
    parser_start_scanner = subparsers.add_parser('start-scanner', help='Start scanner process (standalone)')
    return parser.parse_args()


def simple_main(unattented=False):
    args = handle_args()
    check(args, unattented=unattented)
    return init(args), args


def start_scanner(myapp, args):
    from scanner import Scanner
    Scanner(myapp.config, debug=args.debug).start()


def main():
    myapp, args = simple_main()
    if args.action == 'test-regex':
        from scanner import ScannerTestRegex
        ScannerTestRegex(myapp.config).start()
    elif args.action == 'start':
        if args.with_scanner:
            start_scanner(myapp, args)
        myapp.run(host=args.host, port=args.port, debug=args.debug, use_reloader=args.debug and not args.with_scanner)
    elif args.action == 'start-scanner':
        start_scanner(myapp, args)
    elif args.action == 'check':
        print('OK')

if __name__ == "__main__":
    main()
else:
    app, _ = simple_main(unattented=True)
