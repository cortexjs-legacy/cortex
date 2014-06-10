REPORTER = spec

test:
		@./node_modules/.bin/mocha \
			--reporter $(REPORTER) \
			./test/*.js

canary:
	  node nightly-build.js

.PHONY: test