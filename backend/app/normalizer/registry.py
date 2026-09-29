from app.normalizer.base import VendorAdapter
from app.normalizer.adapters.mock_vendor import MockVendorAdapter

# Add a new vendor here once its adapter is written (see adapters/_template.py
# for the copy-paste starting point) -- this is the only other place besides
# the new adapter file itself that needs to change.
ADAPTER_REGISTRY: dict[str, VendorAdapter] = {
    "mock": MockVendorAdapter(),
}


def get_adapter(vendor_key: str) -> VendorAdapter:
    adapter = ADAPTER_REGISTRY.get(vendor_key)
    if adapter is None:
        raise ValueError(
            f"No adapter registered for vendor '{vendor_key}'. "
            f"Known vendors: {list(ADAPTER_REGISTRY)}"
        )
    return adapter
