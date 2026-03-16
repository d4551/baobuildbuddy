FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV BUN_INSTALL=/root/.bun
ENV CARGO_HOME=/root/.cargo
ENV RUSTUP_HOME=/root/.rustup
ENV PATH=/root/.bun/bin:/root/.cargo/bin:${PATH}

RUN apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=5 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 update \
  && if apt-cache show libfuse2t64 >/dev/null 2>&1; then export FUSE_PACKAGE=libfuse2t64; else export FUSE_PACKAGE=libfuse2; fi \
  && apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=5 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 install -y --no-install-recommends \
    bash \
    build-essential \
    ca-certificates \
    curl \
    file \
    git \
    libayatana-appindicator3-dev \
    libglib2.0-0 \
    librsvg2-dev \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    patchelf \
    pkg-config \
    squashfs-tools \
    ${FUSE_PACKAGE} \
    tar \
    unzip \
  && curl -fsSL https://bun.sh/install | bash \
  && curl https://sh.rustup.rs -sSf | sh -s -- -y --profile minimal --default-toolchain stable \
  && rustup target add aarch64-unknown-linux-gnu \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*
