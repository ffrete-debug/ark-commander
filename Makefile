.PHONY: build test lint clean run docker-build

# Backend
build:
	cd server && go build -o ../bin/ark-commander .

test:
	cd server && go test ./... -v

lint:
	cd server && golangci-lint run ./... 2>/dev/null || echo "golangci-lint not installed, skipping"

clean:
	rm -rf bin/

run:
	cd server && go run .

# Docker
docker-build:
	docker build -t ark-commander .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

# Tools
tidy:
	cd server && go mod tidy

fmt:
	cd server && go fmt ./...
