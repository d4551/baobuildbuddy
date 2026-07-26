import { DECIMAL_RADIX } from "../constants/client-config";
import {
  COUNT_FOUR,
  COUNT_SIXTEEN,
  COUNT_THIRTY_ONE,
  COUNT_TWO_FIFTY_FIVE,
} from "../constants/numeric";
import { LOOPBACK_HOST, LOOPBACK_HOST_IPV4, LOOPBACK_HOST_IPV6 } from "../constants/runtime";

/** IPv4 octet boundaries for loopback, RFC 1918, and link-local ranges. */
const LOOPBACK_FIRST_OCTET = 127;
const PRIVATE_FIRST_OCTET_A = 10;
const PRIVATE_FIRST_OCTET_B = 172;
const PRIVATE_FIRST_OCTET_C = 192;
const PRIVATE_C_SECOND_OCTET = 168;
const LINK_LOCAL_FIRST_OCTET = 169;
const LINK_LOCAL_SECOND_OCTET = 254;

const IP_SEGMENT_PATTERN = /^\d+$/;
const LOCALHOST_SUFFIX_PATTERN = /\.localhost$/i;
const INTERNAL_SUFFIX_PATTERN = /\.internal$/i;
const IPV6_PRIVATE_PREFIX_PATTERN = /^(fc|fd|fe80)/i;

/**
 * Parses a dotted-quad IPv4 host into numeric octets, or null when the host
 * is not a canonical IPv4 literal.
 */
const parseIpv4Segments = (hostname: string): number[] | null => {
  const segments = hostname.split(".");
  if (segments.length !== COUNT_FOUR) {
    return null;
  }

  const parsed: number[] = [];
  for (const segment of segments) {
    if (!IP_SEGMENT_PATTERN.test(segment)) {
      return null;
    }
    const value = Number.parseInt(segment, DECIMAL_RADIX);
    if (!Number.isFinite(value) || value < 0 || value > COUNT_TWO_FIFTY_FIVE) {
      return null;
    }
    parsed.push(value);
  }
  return parsed;
};

const isPrivateOrLoopbackIpv4 = (segments: number[]): boolean => {
  const [first = 0, second = 0] = segments;
  if (first === LOOPBACK_FIRST_OCTET || first === PRIVATE_FIRST_OCTET_A) {
    return true;
  }
  if (first === PRIVATE_FIRST_OCTET_C && second === PRIVATE_C_SECOND_OCTET) {
    return true;
  }
  if (first === LINK_LOCAL_FIRST_OCTET && second === LINK_LOCAL_SECOND_OCTET) {
    return true;
  }
  return (
    first === PRIVATE_FIRST_OCTET_B && second >= COUNT_SIXTEEN && second <= COUNT_THIRTY_ONE
  );
};

/**
 * Returns true when a URL hostname is loopback, RFC 1918 private space, or
 * link-local. Used to fail closed before sending candidate data to
 * automation targets.
 */
export const isLoopbackOrPrivateHost = (rawHostname: string): boolean => {
  const hostname = rawHostname.trim().toLowerCase();
  if (hostname.length === 0) {
    return false;
  }

  if (
    hostname === LOOPBACK_HOST ||
    hostname === LOOPBACK_HOST_IPV4 ||
    hostname === LOOPBACK_HOST_IPV6 ||
    hostname === "localhost.localdomain" ||
    LOCALHOST_SUFFIX_PATTERN.test(hostname) ||
    INTERNAL_SUFFIX_PATTERN.test(hostname) ||
    IPV6_PRIVATE_PREFIX_PATTERN.test(hostname)
  ) {
    return true;
  }

  const ipv4Segments = parseIpv4Segments(hostname);
  if (!ipv4Segments) {
    return false;
  }
  return isPrivateOrLoopbackIpv4(ipv4Segments);
};
