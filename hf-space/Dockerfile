FROM python:3.10-slim

WORKDIR /app

# Install system build dependencies and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install prebuilt CPU llama-cpp-python and other requirements
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    pydantic \
    huggingface_hub \
    --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu \
    llama-cpp-python

COPY . /app

EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
